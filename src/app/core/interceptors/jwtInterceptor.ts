import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, Observable, retry, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from '@services/tokenStorageService';
import { AuthService } from '@services/authService';

let isRefreshing = false;
const pendingRequests: ((token: string) => void)[] = [];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const message = inject(NzMessageService);
  const tokenStorage = injector.get(TokenStorageService);
  const token = tokenStorage.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Never run the refresh flow for public auth endpoints — a 401 there
      // (bad credentials, revoked/expired refresh token) must surface directly,
      // otherwise the refresh call re-enters this interceptor and deadlocks.
      const isPublicAuthEndpoint =
        /\/auth\/(refresh-token|admin-login|user-login|user-signup|forgot-password|reset-password|admin-unlock)/.test(
          req.url,
        );

      if (
        error.status !== 401 ||
        !tokenStorage.getRefreshToken() ||
        isPublicAuthEndpoint
      ) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return new Observable<HttpEvent<unknown>>((subscriber) => {
          pendingRequests.push((newToken: string) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            next(retryReq).subscribe(subscriber);
          });
        });
      }

      isRefreshing = true;
      const authService = injector.get(AuthService);

      return authService.refreshToken().pipe(
        retry({ count: 1 }),
        switchMap((response) => {
          const newAccessToken = response.data.accessToken;
          const newRefreshToken = response.data.refreshToken;
          tokenStorage.saveTokens(newAccessToken, newRefreshToken);

          pendingRequests.forEach((retryRequest) => retryRequest(newAccessToken));
          pendingRequests.length = 0;
          isRefreshing = false;

          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newAccessToken}` },
          });
          return next(retryReq);
        }),
        catchError((err) => {
          isRefreshing = false;
          pendingRequests.length = 0;
          tokenStorage.clear();
          const authService = injector.get(AuthService);
          authService.logout();
          message.error('Session expired. Please log in again.');
          return throwError(() => err);
        }),
      );
    }),
  );
};
