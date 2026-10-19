import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Quote } from '@models/quote.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class QuoteService extends ApiService {
  readonly quotes = signal<Quote[]>([]);
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
    return this.quotes;
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('quotes', httpParams),
      this.quotes,
      (q: any) => this.mapQuote(q),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('quotes', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapQuote(x))),
    );
  }

  private mapQuote(q: any): Quote {
    const status = q.status || 'pending';
    return {
      ...q,
      customer: q.customerName || '',
      email: q.customerEmail || '',
      phone: q.customerPhone || '',
      company: q.customerCompany || '',
      quoteId: q.quoteNumber || '',
      date: formatDateTime(q.createdAt),
      service: q.serviceType || '',
      layers: q.details?.layers || '',
      quantity: q.details?.quantity || '',
      estimatedCost: q.totalPrice != null ? `Rs. ${Number(q.totalPrice).toFixed(2)}` : '',
      status,
      statusType: this.getStatusType(status),
    };
  }

  private getStatusType(status: string): string {
    switch (status.toLowerCase()) {
      case 'quoted': case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'declined': case 'cancelled': return 'error';
      case 'paid': return 'processing';
      default: return 'info';
    }
  }

  updateStatus(id: string, status: string) {
    return this.put<any>(`quotes/${id}/status`, { status });
  }
}
