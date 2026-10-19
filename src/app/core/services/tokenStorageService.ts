import { Injectable, signal, computed } from '@angular/core';

const TOKEN_KEY = 'admin_token';
const REFRESH_KEY = 'admin_refresh_token';
const USER_KEY = 'admin_user';

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string | null;
  phone?: string;
  address?: string;
  createdAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly _user = signal<AdminUser | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user() && !!this.getToken());

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  saveTokens(token: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  saveUser(user: AdminUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private loadUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
