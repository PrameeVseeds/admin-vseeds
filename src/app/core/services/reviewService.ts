import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Review } from '@models/review.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class ReviewService extends ApiService {
  readonly reviews = signal<Review[]>([]);
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
    return this.reviews;
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('review/admin/all', httpParams),
      this.reviews,
      (r: any) => this.mapReview(r),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('review/admin/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapReview(x))),
    );
  }

  private mapReview(r: any): Review {
    const approved = r.isApproved;
    const status = approved === true ? 'approved' : approved === false ? 'rejected' : 'pending';
    return {
      ...r,
      customer: r.name || '',
      product: r.productName || '',
      comment: r.reviewText || '',
      date: formatDateTime(r.createdAt),
      status,
      statusType: this.getStatusType(status),
    };
  }

  private getStatusType(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'info';
    }
  }

  delete(id: string) {
    return this.del<any>(`review/delete/${id}`);
  }

  adminReply(id: string, reply: string) {
    return this.put<any>(`review/admin-reply/${id}`, { adminReply: reply });
  }
}
