import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '@env';
import { TokenStorageService } from './tokenStorageService';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  data: {
    requires2fa: boolean;
    tempToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: number;
      email: string;
      username: string;
      role: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiBaseUrl;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/admin-login`, credentials).pipe(
      tap((res) => {
        if (!res.data.requires2fa && res.data.accessToken) {
          this.saveSession(res.data);
        }
      }),
    );
  }

  verifyLoginOtp(tempToken: string, code: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/admin-login/2fa`, { tempToken, code })
      .pipe(
        tap((res) => {
          if (res.data.accessToken) {
            this.saveSession(res.data);
          }
        }),
      );
  }

  private saveSession(data: LoginResponse['data']): void {
    if (!data.accessToken || !data.user) return;
    this.tokenStorage.saveTokens(data.accessToken, data.refreshToken!);
    this.tokenStorage.saveUser({
      id: String(data.user.id),
      email: data.user.email,
      username: data.user.username,
      firstName: data.user.username?.split(' ')[0] || data.user.username || '',
      lastName: data.user.username?.split(' ').slice(1).join(' ') || '',
      role: data.user.role,
    });
  }

  fetchProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/profile`).pipe(
      tap((res) => {
        const profile = res.data;
        if (profile) {
          this.tokenStorage.saveUser({
            id: String(profile.id),
            email: profile.email,
            username: profile.username,
            firstName: profile.username?.split(' ')[0] || profile.username || '',
            lastName: profile.username?.split(' ').slice(1).join(' ') || '',
            role: profile.role || 'Admin',
            avatar: profile.avatar || null,
            phone: profile.phone || '',
            address: profile.address || '',
            createdAt: profile.createdAt || null,
          });
        }
      }),
    );
  }

  updateProfile(data: { username?: string; phone?: string; address?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/update-profile`, data).pipe(
      tap((res) => {
        const profile = res.data;
        if (profile) {
          this.tokenStorage.saveUser({
            id: String(profile.id),
            email: profile.email,
            username: profile.username,
            firstName: profile.username?.split(' ')[0] || profile.username || '',
            lastName: profile.username?.split(' ').slice(1).join(' ') || '',
            role: profile.role || 'Admin',
            avatar: profile.avatar || null,
            phone: profile.phone || '',
            address: profile.address || '',
            createdAt: profile.createdAt || null,
          });
        }
      }),
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admins/password/update`, data);
  }

  setup2fa(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/setup`, {});
  }

  verify2fa(token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/verify`, { token });
  }

  disable2fa(token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/2fa/disable`, { token });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, {
      email,
      portal: 'admin',
    });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  refreshToken(): Observable<{ data: { accessToken: string; refreshToken: string } }> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    return this.http.post<{ data: { accessToken: string; refreshToken: string } }>(
      `${this.apiUrl}/auth/refresh-token`,
      { refreshToken },
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly tokenStorage: TokenStorageService,
  ) {}
}
