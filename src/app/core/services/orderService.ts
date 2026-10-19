import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Order } from '@models/order.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class OrderService extends ApiService {
  readonly orders = signal<Order[]>([]);
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
    return this.orders;
  }

  getById(id: string): Order | undefined {
    return this.orders().find((o: Order) => o.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`orders/order-by-id/${id}`);
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('orders/all', httpParams),
      this.orders,
      (o: any) => this.mapOrder(o),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('orders/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapOrder(x))),
    );
  }

  private mapOrder(o: any): Order {
    const raw = o.status || 'pending';
    const status = this.formatStatus(raw);
    return {
      ...o,
      customer: o.email || o.userEmail || '',
      date: formatDateTime(o.createdAt),
      items: o.itemCount ?? o.items?.length ?? 0,
      amount: o.totalAmount ?? 0,
      order: o.orderNumber || o.id,
      status,
      statusType: this.getStatusType(raw),
    };
  }

  private formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private getStatusType(status: string): string {
    switch (status.toLowerCase().replace(/ /g, '_')) {
      case 'delivered': return 'success';
      case 'processing': case 'shipped': return 'processing';
      case 'pending': case 'waiting_for_payment': return 'warning';
      case 'cancelled': case 'refunded': return 'error';
      default: return 'info';
    }
  }

  updateStatus(id: string, status: string) {
    return this.put<any>(`orders/status/${id}`, { status }).pipe(tap(() => this.loadAll()));
  }

  addShipping(id: string, data: any) {
    return this.post<any>(`orders/shipping/${id}`, data).pipe(tap(() => this.loadAll()));
  }

  updateOrder(id: string, data: any) {
    return this.put<any>(`orders/update/${id}`, data).pipe(tap(() => this.loadAll()));
  }

  getCounts() {
    return this.get<any>('orders/count');
  }

  sendPaymentRequest(orderId: string) {
    return this.post<any>(`orders/send-payment-request/${orderId}`, {});
  }
}
