import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { User } from '@models/user.model';
import { formatDateOnly } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  readonly users = signal<User[]>([]);
  readonly paginationMeta = signal<PaginationMeta>({ total: 0, totalPages: 1, page: 1 });

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.users;
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('users/admin/all', httpParams),
      this.users,
      (u: any) => this.mapUser(u),
      this.paginationMeta,
    );
  }

  updateStatus(id: string, status: string) {
    const backendStatus = status.toLowerCase() === 'active' ? 'active' : 'inactive';
    return this.put<any>(`users/admin/update-status/${id}`, { status: backendStatus });
  }

  search(query: string) {
    return this.get<any[]>(`users/admin/search?q=${query}`);
  }

  getCounts() {
    return this.get<any>('users/count');
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('users/admin/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapUser(x))),
    );
  }

  private mapUser(u: any): User {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '-';
    const joined = u.createdAt ? formatDateOnly(u.createdAt) : '-';
    const totalSpent =
      typeof u.totalSpent === 'number'
        ? `Rs. ${u.totalSpent.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
        : 'Rs. 0.00';
    const statusRaw = (u.status ?? 'active').toLowerCase();

    return {
      ...u,
      name,
      joined,
      orders: u.orderCount ?? 0,
      totalSpent,
      totalSpentRaw: typeof u.totalSpent === 'number' ? u.totalSpent : 0,
      company: u.company ?? '',
      status: statusRaw === 'active' ? 'Active' : 'Inactive',
      statusType: statusRaw === 'active' ? 'success' : 'danger',
    };
  }
}
