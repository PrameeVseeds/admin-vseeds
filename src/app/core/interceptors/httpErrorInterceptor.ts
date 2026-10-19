import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const message = inject(NzMessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401s and refresh-token failures are handled by the JWT interceptor.
      if (error.status === 401 || req.url.includes('/auth/refresh-token')) {
        return throwError(() => error);
      }

      const text = error.error?.message || error.message || 'An unexpected error occurred';
      message.error(text);
      return throwError(() => error);
    }),
  );
};
