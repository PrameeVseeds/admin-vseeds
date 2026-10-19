import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Payment } from '@models/payment.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class PaymentService extends ApiService {
  readonly payments = signal<Payment[]>([]);
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
    return this.payments;
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('payments/all', httpParams),
      this.payments,
      (p: any) => this.mapPayment(p),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('payments/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapPayment(x))),
    );
  }

  private mapPayment(p: any): Payment {
    const status = p.status || 'pending';
    const customerName = [p.firstName, p.lastName].filter(Boolean).join(' ');
    return {
      ...p,
      customer: customerName || p.userEmail || '',
      email: p.userEmail || '',
      order: p.orderNumber || p.paymentNumber || p.orderId || '',
      paymentNumber: p.paymentNumber || '',
      date: formatDateTime(p.createdAt || p.paidAt || ''),
      method: this.formatMethod(p.paymentMethod || ''),
      amount: p.amount != null ? +p.amount : (p.orderTotal != null ? +p.orderTotal : 0),
      referenceNumber: p.referenceNumber || '',
      status,
      statusType: this.getStatusType(status),
    };
  }

  private formatMethod(method: string): string {
    return method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private getStatusType(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'info';
    }
  }

  getCounts() {
    return this.get<any>('payments/count');
  }

  updateByOrderId(orderId: string, data: any) {
    return this.put<any>(`payments/update/${orderId}`, data);
  }
}
