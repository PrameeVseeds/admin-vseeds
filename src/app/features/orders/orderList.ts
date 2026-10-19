import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { OrderService } from 'src/app/core/services/orderService';
import { InvoiceTemplateService } from 'src/app/core/services/invoiceTemplate.service';
import { OrderDetailModalComponent } from 'src/app/shared/components/order-detail-modal/order-detail-modal.component';
import { formatDateTime, DateTimePipe } from 'src/app/shared/pipes/date-format.pipe';
import { openModal } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';
import {
  DEFAULT_INVOICE_SETTINGS,
  InvoiceTemplateSettings,
  SampleInvoiceData,
  buildInvoiceDocument,
} from 'src/app/features/invoices/invoice-doc';

type OrderItem = any;

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [BaseListComponent, NzTooltipModule, NzModalModule, LucideAngularModule, DateTimePipe],
  templateUrl: './orderList.html',
  styleUrl: './orderList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderListComponent {
  protected readonly orders: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  protected readonly activeTab = signal('all');
  protected readonly statusCounts = signal({
    total: 0,
    pending: 0,
    waiting_for_payment: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  });
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getStatusCount('all') },
    { label: 'Pending', value: 'pending', count: this.getStatusCount('pending') },
    { label: 'Waiting for Payment', value: 'waiting_for_payment', count: this.getStatusCount('waiting_for_payment') },
    { label: 'Processing', value: 'processing', count: this.getStatusCount('processing') },
    { label: 'Shipped', value: 'shipped', count: this.getStatusCount('shipped') },
    { label: 'Delivered', value: 'delivered', count: this.getStatusCount('delivered') },
    { label: 'Cancelled', value: 'cancelled', count: this.getStatusCount('cancelled') },
    { label: 'Refunded', value: 'refunded', count: this.getStatusCount('refunded') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'order', label: 'Order ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'items', label: 'Items' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly processingCount: any;
  protected readonly deliveredCount: any;
  protected readonly cancelledCount: any;

  getStatusCount(status: string): number {
    const counts = this.statusCounts();
    if (status === 'all') return counts['total'] ?? this.paginationMeta().total;
    return (counts as any)[status] ?? 0;
  }

  onSearchChange(_value: string): void {
    this.reloadData(1);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.reloadData(1);
  }

  onPageChange(page: number): void {
    this.reloadData(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.reloadData(1);
  }

  private reloadData(page: number): void {
    const tab = this.activeTab();
    this.orderService.loadAll({
      page,
      limit: this.pageSize,
      status: tab !== 'all' ? tab : undefined,
    });
  }

  openStatusModal(order: OrderItem): void {
    this.orderService.loadById(order.id).subscribe({
      next: (raw: any) => {
        const data:any = this.mapOrderDetail(raw);

        setTimeout(() => {
          const modal = openModal(this.modalService, {
            content: OrderDetailModalComponent,
            width: '720px',
            className: 'order-detail-modal',
          });

          modal.componentInstance!.data = data;

          modal.afterClose.subscribe((result: any) => {
            if (result?.action === 'print' || result?.action === 'download') {
              this.generateInvoice(data, result.action);
            }
          });
        }, 0);
      },
      error: () => this.message.error('Failed to load order details'),
    });
  }

  private mapOrderDetail(raw: any): any {
    const order = raw?.data ?? raw;
    const rawStatus = String(order?.status || 'pending');
    const formattedStatus = rawStatus
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const lineItems = (order?.items || []).map((item: any) => ({
      product: item.productName || 'Product',
      store: item.store || 'VSEEDS',
      qty: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      total: this.formatCurrency(Number(item.totalPrice) || 0),
    }));

    const shipment = order?.shipments?.[0]
      ? {
          method: order.shipments[0].carrier || 'Standard Delivery',
          tracking: order.shipments[0].trackingNumber || '',
          estimatedDate: order.shipments[0].expectedDeliveryAt
            ? formatDateTime(order.shipments[0].expectedDeliveryAt)
            : 'TBD',
        }
      : undefined;

    const payment = order?.payments?.[0]
      ? {
          method: order.payments[0].paymentMethod || '',
          status: order.payments[0].status || 'Pending',
        }
      : undefined;

    const shippingAddress = order?.shippingAddress
      ? {
          ...order.shippingAddress,
          address: order.shippingAddress.addressLine1 || order.shippingAddress.address || '',
          fullName: order.shippingAddress.fullName || '',
        }
      : undefined;

    return {
      id: order?.id,
      orderNumber: order?.orderNumber,
      customer: order?.userEmail || order?.shippingAddress?.fullName || '',
      email: order?.userEmail || '',
      phone: order?.shippingAddress?.phone || '',
      date: formatDateTime(order?.createdAt),
      items: lineItems.length,
      amount: this.formatCurrency(Number(order?.totalAmount) || 0),
      status: formattedStatus,
      statusType: this.getStatusType(rawStatus),
      shippingAddress,
      shippingFee: Number(order?.shippingFee) || 0,
      taxAmount: Number(order?.taxAmount) || 0,
      totalRaw: Number(order?.totalAmount) || 0,
      lineItems,
      shipment,
      payment,
    };
  }

  private getStatusType(status: string): string {
    switch (String(status).toLowerCase().replace(/ /g, '_')) {
      case 'delivered': return 'success';
      case 'processing': case 'shipped': return 'processing';
      case 'pending': case 'waiting_for_payment': return 'warning';
      case 'cancelled': case 'refunded': return 'error';
      default: return 'info';
    }
  }

  viewOrder(order: OrderItem): void {
    this.openStatusModal(order);
  }

  editOrder(order: OrderItem): void {
    this.router.navigate(['/orders', order.id, 'edit']);
  }

  downloadInvoice(order: OrderItem): void {
    this.orderService.loadById(order.id).subscribe({
      next: (raw: any) => {
        const data = this.mapOrderDetail(raw);
        this.generateInvoice(data, 'download');
      },
      error: () => this.message.error('Failed to load order details'),
    });
  }

  private formatCurrency(value: number): string {
    return 'Rs. ' + (+value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  constructor(
    private readonly orderService: OrderService,
    private readonly modalService: NzModalService,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly invoiceTemplateService: InvoiceTemplateService,
  ) {
    this.orders = this.orderService.getAll();
    this.paginationMeta = this.orderService.paginationMeta;
    this.loading = this.orderService.loading;
    this.processingCount = computed(
      () => (this.statusCounts().processing || 0) + (this.statusCounts().pending || 0),
    );
    this.deliveredCount = computed(
      () => (this.statusCounts().delivered || 0) + (this.statusCounts().shipped || 0),
    );
    this.cancelledCount = computed(
      () => (this.statusCounts().cancelled || 0) + (this.statusCounts().refunded || 0),
    );
    this.loadStatusCounts();
  }

  private loadStatusCounts(): void {
    this.orderService.getCounts().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.statusCounts.set({
          total: data.total ?? 0,
          pending: data.pending ?? 0,
          waiting_for_payment: data.waitingForPayment ?? 0,
          processing: data.processing ?? 0,
          shipped: data.shipped ?? 0,
          delivered: data.delivered ?? 0,
          cancelled: data.cancelled ?? 0,
          refunded: data.refunded ?? 0,
        });
      },
      error: () => this.message.error('Failed to load order counts'),
    });
  }

  private buildInvoiceData(data: any): SampleInvoiceData {
    const items = (data.lineItems || []).map((it: any, i: number) => {
      const qty = +(it.qty || 0);
      const unitPrice = +(it.unitPrice || 0);
      const total = qty * unitPrice;
      return {
        no: i + 1,
        name: it.product || 'Product',
        qty,
        unitPrice,
        total,
      };
    });

    const total = +(data.totalRaw || 0);
    const shipping = +(data.shippingFee || 0);
    const tax = +(data.taxAmount || 0);
    const subtotal = Math.max(0, total - shipping - tax);

    return {
      invoiceId: data.orderNumber || data.id || '—',
      date: data.date || '—',
      dueDate: data.date || '—',
      orderNumber: data.orderNumber || data.id || '—',
      customerName: data.customer || 'Customer',
      customerEmail: data.email || '',
      customerPhone: data.phone || '',
      status: (() => {
        const payment = String(data.payment?.status || '').toLowerCase();
        const order = String(data.status || '').toLowerCase().replace(/ /g, '_');
        const isPaymentPaid = ['paid', 'completed', 'succeeded', 'successful', 'done'].some((k) => payment === k);
        const isDelivered = order === 'delivered';
        if (isPaymentPaid || isDelivered) return 'Paid';
        return data.payment?.status || data.status || '—';
      })(),
      items,
      subtotal,
      tax,
      shipping,
      total,
    };
  }

  private generateInvoice(data: any, _action: 'print' | 'download' = 'print'): void {
    this.invoiceTemplateService.getActive().subscribe({
      next: (tpl) => {
        const settings: InvoiceTemplateSettings = {
          ...DEFAULT_INVOICE_SETTINGS,
          ...(tpl?.settings || {}),
        };
        const invoiceData = this.buildInvoiceData(data);
        const html = buildInvoiceDocument(settings, invoiceData);
        const win = window.open('', '_blank');
        if (!win) {
          this.message.error('Pop-up blocked. Allow pop-ups to print the invoice.');
          return;
        }
        let printed = false;
        const doPrint = () => {
          if (printed) return;
          printed = true;
          win.focus();
          win.print();
        };
        win.onload = doPrint;
        win.document.write(html);
        win.document.close();
        setTimeout(doPrint, 400);
      },
      error: () => this.message.error('Failed to load active invoice template'),
    });
  }
}
