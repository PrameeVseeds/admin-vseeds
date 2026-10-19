import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Banner } from '@models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannerService extends ApiService {
  readonly banners = signal<Banner[]>([]);
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
    return this.banners;
  }

  loadById(id: string) {
    return this.get<any>(`banner/${id}`);
  }

  loadAll() {
    this.loadData(
      this.get<any>('banner'),
      this.banners,
      (b: any) => this.mapBanner(b),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('banner', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapBanner(x))),
    );
  }

  private mapBanner(b: any): Banner {
    const now = new Date();
    let status = b.isActive ? 'Active' : 'Inactive';

    if (b.isActive) {
      if (b.startsAt && new Date(b.startsAt) > now) {
        status = 'Scheduled';
      } else if (b.endsAt && new Date(b.endsAt) < now) {
        status = 'Expired';
      }
    }

    let statusType = 'neutral';
    if (status === 'Active') statusType = 'success';
    if (status === 'Scheduled') statusType = 'info';
    if (status === 'Expired') statusType = 'warning';
    if (status === 'Inactive') statusType = 'danger';

    return {
      ...b,
      position: b.deviceType
        ? b.deviceType.charAt(0).toUpperCase() + b.deviceType.slice(1)
        : 'Desktop',
      startDate: b.startsAt ? new Date(b.startsAt).toISOString().split('T')[0] : '-',
      endDate: b.endsAt ? new Date(b.endsAt).toISOString().split('T')[0] : 'Ongoing',
      status,
      statusType,
      clicks: 0,
    };
  }

  add(formData: FormData) {
    return this.postForm<any>('banner/add', formData).pipe(tap(() => this.loadAll()));
  }

  update(id: string, formData: FormData) {
    return this.put<any>(`banner/update/${id}`, formData).pipe(tap(() => this.loadAll()));
  }

  delete(id: string) {
    this.del<any>(`banner/delete/${id}`).subscribe({
      next: () => this.banners.update((list: Banner[]) => list.filter((b: Banner) => b.id !== id)),
    });
  }

  updateStatus(id: string, active: boolean) {
    this.put<any>(`banner/status/${id}`, { active }).subscribe({ next: () => this.loadAll() });
  }
}
