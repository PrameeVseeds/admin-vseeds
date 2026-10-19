import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

export interface InvoiceParams extends PaginationParams {
  paymentStatus?: string;
  customer?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService extends ApiService {
  readonly invoices = signal<any[]>([]);
  readonly paginationMeta = signal<PaginationMeta>({ total: 0, totalPages: 1, page: 1 });


  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    this.loadAll();
    return this.invoices;
  }

  loadAll(params?: InvoiceParams) {
    const httpParams = this.buildInvoiceParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('invoices', httpParams),
      this.invoices,
      (i: any) => this.mapInvoice(i),
      this.paginationMeta,
    );
  }

  private buildInvoiceParams(params: InvoiceParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);
    if (params.paymentStatus && params.paymentStatus !== 'all') httpParams = httpParams.set('paymentStatus', params.paymentStatus);
    const customer = params.customer || params.search;
    if (customer) httpParams = httpParams.set('customer', customer);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    return httpParams;
  }

  generate(orderId: string): Observable<any> {
    return this.post<any>(`invoices/generate/${orderId}`, {});
  }

  generateAll(): Observable<any> {
    return this.post<any>('invoices/generate-all', {});
  }

  getById(id: string): Observable<any> {
    return this.get<any>(`invoices/${id}`).pipe(map((res: any) => res?.data ?? res));
  }

  getByOrderId(orderId: string): Observable<any> {
    return this.get<any>(`invoices/order/${orderId}`).pipe(map((res: any) => res?.data ?? res));
  }

  send(id: string): Observable<any> {
    return this.put<any>(`invoices/${id}/send`, {});
  }

  getAllForExport(params?: InvoiceParams): Observable<any[]> {
    const httpParams = this.buildInvoiceParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('invoices', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapInvoice(x))),
    );
  }

  private mapInvoice(i: any): any {
    const status = this.formatStatus(i.status || 'generated');
    const paymentStatus = this.formatStatus(i.paymentStatus || 'pending');
    return {
      ...i,
      invoiceNumber: i.invoiceNumber || i.id,
      orderNumber: i.orderNumber || i.order?.orderNumber || i.orderId || '',
      customer: i.customerName || i.customer || i.order?.customer || i.userEmail || '',
      date: formatDateTime(i.invoiceDate || i.createdAt),
      totalAmount: i.totalAmount ?? i.total ?? 0,
      paymentStatus,
      status,
      statusType: this.getStatusType(status),
      paymentStatusType: this.getPaymentStatusType(paymentStatus),
    };
  }

  private formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private getStatusType(status: string): string {
    switch (status.toLowerCase().replace(/ /g, '_')) {
      case 'paid': return 'success';
      case 'sent': return 'info';
      case 'generated': return 'warning';
      case 'cancelled': return 'error';
      default: return 'info';
    }
  }

  private getPaymentStatusType(status: string): string {
    switch (status.toLowerCase().replace(/ /g, '_')) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'info';
    }
  }
}
