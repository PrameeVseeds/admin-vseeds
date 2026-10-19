import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Admin } from '@models/admin.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class AdminService extends ApiService {
  readonly admins = signal<Admin[]>([]);

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.admins;
  }
  getById(id: string): Admin | undefined {
    return this.admins().find((a: Admin) => a.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`admins/${id}`);
  }

  loadAll() {
    this.loadData(
      this.get<any>('admins/all?limit=10'),
      this.admins,
      (a: any) => this.mapAdmin(a),
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('admins/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapAdmin(x))),
    );
  }

  private mapAdmin(a: any): Admin {
    const status = this.capitalize(a.status);
    return {
      ...a,
      name: a.username ?? '-',
      role: this.capitalize(a.role ?? ''),
      roleId: a.roleId,
      status,
      statusRaw: a.status,
      statusType: this.statusToType(a.status),
      lastLogin: a.lastLoginAt ? this.formatDate(a.lastLoginAt) : 'Never',
    };
  }

  private capitalize(s?: string): string {
    if (!s) return '-';
    return s
      .split(' ')
      .map((w: any) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  private statusToType(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'suspended':
        return 'warning';
      default:
        return 'info';
    }
  }

  private formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return formatDateTime(d);
    } catch {
      return '-';
    }
  }

  add(admin: any) {
    return this.post<any>('admins/add', admin).pipe(tap(() => this.loadAll()));
  }

  update(id: string, admin: any) {
    return this.put<any>(`admins/update/${id}`, admin).pipe(tap(() => this.loadAll()));
  }

  delete(id: string) {
    return this.del<any>(`admins/delete/${id}`);
  }
}
