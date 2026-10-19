import { Injectable, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, PaginationParams } from './apiService';
import { ApiResponse } from '../models/api.models';
import { ActivityLog } from '@models/activityLog.model';
import { HttpClient } from '@angular/common/http';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

const ENTITY_LABELS: Record<string, string> = {
  product: 'Product',
  category: 'Category',
  order: 'Order',
  user: 'User',
  admin: 'Admin',
  role: 'Role',
  banner: 'Banner',
  blog: 'Blog',
  faq: 'FAQ',
  project: 'Project',
  setting: 'Setting',
  contact: 'Contact',
  review: 'Review',
  payment: 'Payment',
  delivery: 'Delivery',
  media: 'Media',
  quote: 'Quote',
  email_template: 'Email Template',
  wishlist: 'Wishlist',
  auth: 'Auth',
  other: 'Other',
};

@Injectable({ providedIn: 'root' })
export class ActivityLogService extends ApiService {
  readonly logs = signal<ActivityLog[]>([]);
  readonly recentLogs = signal<ActivityLog[]>([]);
  readonly headerNotifications = signal<ActivityLog[]>([]);

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.logs;
  }

  loadAll() {
    this._loading.set(true);
    this._error.set(null);
    this.get<any>('activity-logs?limit=10').subscribe({
      next: (res) => {
        const data = res.data?.logs ?? res.data ?? [];
        const raw = Array.isArray(data) ? data : [];
        this.logs.set(raw.map((l: any) => this.mapLog(l)));
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this._error.set(err?.error?.message || 'Failed to load activity logs');
        this.logs.set([]);
      },
    });
  }

  getDetail(id: string): Observable<ApiResponse<any>> {
    return this.get<any>(`activity-logs/detail/${id}`);
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('activity-logs', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapLog(x))),
    );
  }

  private mapLog(l: any): ActivityLog {
    const actionMap: Record<string, string> = {
      login: 'Login',
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
    };
    const action = actionMap[(l.action || '').toLowerCase()] || l.action || 'Unknown';
    const actionTypeMap: Record<string, string> = {
      Login: 'info',
      Created: 'success',
      Updated: 'warning',
      Deleted: 'danger',
    };

    const entityLabel = ENTITY_LABELS[l.entityType] || l.entityType || '-';
    const entityIdStr = l.entityId ? String(l.entityId).trim() : '';
    const entityDisplayName =
      (l.entityDisplayName && String(l.entityDisplayName).trim()) ||
      (entityIdStr.length >= 8 ? `…${entityIdStr.slice(-8)}` : entityIdStr) ||
      '';
    const hasChanges = !!(l.metadata?.changes?.length || l.metadata?.oldData);
    const resourceLabel =
      entityIdStr && entityDisplayName
        ? `${entityLabel} · ${entityDisplayName}`
        : entityLabel;

    return {
      ...l,
      userName: l.actorName || (l.actorId ? `${l.actorType || 'user'} #${l.actorId}` : 'System'),
      userEmail: l.actorEmail || '',
      userRole: l.actorRole || l.actorType || 'system',
      action,
      actionType: actionTypeMap[action] || 'info',
      entityDisplayName: entityIdStr ? entityDisplayName : '',
      resourceLabel,
      resourceType: entityLabel,
      resource: l.entityType || '-',
      description: l.description || '-',
      ip: l.ipAddress || '-',
      date: formatDateTime(l.createdAt),
      hasChanges,
      changes: l.metadata?.changes || [],
    };
  }

  loadRecent(limit = 10) {
    this.get<any>(`activity-logs?limit=${limit}`).subscribe({
      next: (res) => {
        const data = res.data?.logs ?? res.data ?? [];
        this.recentLogs.set(Array.isArray(data) ? data : []);
      },
    });
  }

  loadNotifications(days = 7, limit = 30) {
    this.get<any>(`activity-logs/notifications?days=${days}&limit=${limit}`).subscribe({
      next: (res) => {
        const items = res.data?.notifications ?? res.data ?? [];
        this.headerNotifications.set(Array.isArray(items) ? items : []);
      },
      error: () => this.headerNotifications.set([]),
    });
  }

  deleteLog(id: string): Observable<ApiResponse<any>> {
    return this.del<any>(`activity-logs/${id}`);
  }

  query(params: string): Observable<ApiResponse<any>> {
    return this.get<any>(`activity-logs?${params}`);
  }
}
