import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Role } from '@models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService extends ApiService {
  readonly roles = signal<Role[]>([]);
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
    return this.roles;
  }
  getById(id: string): Role | undefined {
    return this.roles().find((r: Role) => r.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`roles/${id}`);
  }

  loadAll() {
    this.loadData(
      this.get<any>('roles/all'),
      this.roles,
      (r: any) => this.mapRole(r),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('roles/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapRole(x))),
    );
  }

  private mapRole(r: any): Role {
    const name = this.capitalize(r.name);
    const privs: string[] = r.privileges ?? [];
    const modules = [...new Set(privs.map((p: string) => p.split('.')[0]))];
    const permissions = modules
      .map((m: string) => this.capitalize(m.replace(/_/g, ' ')))
      .join(', ');
    return {
      ...r,
      name,
      description: r.description ?? '',
      members: r.members ?? 0,
      privileges: privs,
      permissions,
      privilegeCount: privs.length,
      statusType: r.isSystem ? 'violet' : 'info',
      status: r.isSystem ? 'System' : 'Custom',
    };
  }

  private capitalize(s?: string): string {
    if (!s) return '-';
    return s
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  getPrivilegesForRole(roleId: string) {
    return this.get<any>(`roles/privilege/${roleId}`);
  }

  getAllPrivileges() {
    return this.get<any>('roles/privilege/all');
  }

  add(role: any) {
    return this.post<any>('roles/add', role);
  }

  update(id: string, role: any) {
    return this.put<any>(`roles/update/${id}`, role);
  }

  bulkSetPrivileges(roleId: string, privilegeIds: string[]) {
    return this.put<any>(`roles/privilege/bulk/${roleId}`, { privilegeIds });
  }

  delete(id: string) {
    this.del<any>(`roles/delete/${id}`).subscribe({
      next: () => this.roles.update((list: Role[]) => list.filter((r: Role) => r.id !== id)),
    });
  }
}
