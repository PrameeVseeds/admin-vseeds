import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Delivery } from '@models/delivery.model';
import { formatDateTime, formatDateOnly } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class DeliveryService extends ApiService {
  readonly deliveries = signal<Delivery[]>([]);
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
    return this.deliveries;
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('delivery/all', httpParams),
      this.deliveries,
      (s: any) => this.mapShipment(s),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('delivery/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapShipment(x))),
    );
  }

  private mapShipment(s: any): Delivery {
    const deliveryStatus = this.deriveDeliveryStatus(s);
    const customerName = [s.firstName, s.lastName].filter(Boolean).join(' ');
    return {
      ...s,
      tracking: s.trackingNumber || '—',
      order: s.orderNumber || s.orderId || '—',
      customer: customerName || s.userEmail || '—',
      carrier: s.carrier || '—',
      shipped: formatDateTime(s.shippedAt),
      estimated: formatDateOnly(s.expectedDeliveryAt),
      status: deliveryStatus,
      statusType: this.getStatusType(deliveryStatus),
    };
  }

  private deriveDeliveryStatus(s: any): string {
    if (s.deliveredAt) return 'Delivered';
    if (s.orderStatus === 'delivered') return 'Delivered';
    if (s.shippedAt) return 'In Transit';
    if (s.orderStatus === 'shipped') return 'In Transit';
    return 'Pending Pickup';
  }

  private getStatusType(status: string): string {
    switch (status) {
      case 'Delivered': return 'success';
      case 'In Transit': return 'info';
      case 'Pending Pickup': return 'warning';
      default: return 'info';
    }
  }

  createShipment(orderId: string, data: any) {
    return this.post<any>(`orders/shipping/${orderId}`, data).pipe(tap(() => this.loadAll()));
  }
}
