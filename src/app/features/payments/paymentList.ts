import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { PaymentService } from 'src/app/core/services/paymentService';
import { PaymentDetailModalComponent } from 'src/app/shared/components/payment-detail-modal/payment-detail-modal.component';
import {
  StatusUpdateModalComponent,
  StatusOption,
} from 'src/app/shared/components/status-update-modal/status-update-modal.component';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';

type PaymentItem = any;

const PAYMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'pending', label: 'Pending', icon: 'clock', color: '#f59e0b', bgClass: 'opt--warning' },
  {
    value: 'completed',
    label: 'Completed',
    icon: 'check-circle',
    color: '#10b981',
    bgClass: 'opt--success',
  },
  {
    value: 'failed',
    label: 'Failed',
    icon: 'x-circle',
    color: '#ef4444',
    bgClass: 'opt--error',
  },
  { value: 'refunded', label: 'Refunded', icon: 'refresh-cw', color: '#3b82f6', bgClass: 'opt--info' },
];

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [DecimalPipe, BaseListComponent, NzTooltipModule, NzModalModule, LucideAngularModule],
  templateUrl: './paymentList.html',
  styleUrl: './paymentList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent {
  protected readonly totalCount = signal(0);
  protected readonly statusCounts = signal({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    refunded: 0,
  });
  protected readonly payments: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  protected readonly activeTab = signal('all');
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getStatusCount('all') },
    { label: 'Pending', value: 'pending', count: this.getStatusCount('pending') },
    { label: 'Completed', value: 'completed', count: this.getStatusCount('completed') },
    { label: 'Failed', value: 'failed', count: this.getStatusCount('failed') },
    { label: 'Refunded', value: 'refunded', count: this.getStatusCount('refunded') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'transaction', label: 'Transaction ID' },
    { key: 'customer', label: 'Customer / Order' },
    { key: 'method', label: 'Method' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly completedCount: any;
  protected readonly pendingCount: any;
  protected readonly cancelledCount: any;
  protected readonly refundCount: any;

  getStatusCount(status: string): number {
    const counts = this.statusCounts();
    if (status === 'all') return counts.total || this.paginationMeta().total;
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
    this.paymentService.loadAll({
      page,
      limit: this.pageSize,
      status: tab !== 'all' ? tab : undefined,
    });
  }

  openStatusModal(payment: PaymentItem): void {
    const modal = openModal(this.modalService, {
      content: StatusUpdateModalComponent,
      data: {
        entityId: payment.id,
        subtitle: payment.customer,
        currentStatus: payment.status,
        title: 'Update Payment Status',
        options: PAYMENT_STATUS_OPTIONS,
      },
      width: '440px',
      className: 'status-update-modal',
    });

    modal.afterClose.subscribe((newStatus: string | null) => {
      if (newStatus && newStatus !== payment.status) {
        this.paymentService.updateByOrderId(payment.orderId || payment.id, { status: newStatus.toLowerCase() }).subscribe({
          next: () => {
            this.paymentService.loadAll();
            this.message.success(`${payment.id} status updated to ${newStatus}`);
          },
          error: () => this.message.error('Failed to update payment status'),
        });
      }
    });
  }

  viewPayment(payment: PaymentItem): void {
    openModal(this.modalService, {
      content: PaymentDetailModalComponent,
      data: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        order: payment.order,
        customer: payment.customer,
        email: payment.email,
        method: payment.method,
        amount: payment.amount,
        referenceNumber: payment.referenceNumber,
        date: payment.date,
        status: payment.status,
        statusType: payment.statusType,
      },
      width: '580px',
      className: 'payment-detail-modal',
    });
  }

  exportPayments(): void {
    this.paymentService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['ID', 'Order', 'Customer', 'Method', 'Amount', 'Date', 'Status'];
    const rows = data.map((p: any) => [p.id, p.order, p.customer, p.method, p.amount, p.date, p.status]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Payments exported successfully');
    });
  }

  constructor(
    private readonly paymentService: PaymentService,
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
  ) {
    this.payments = this.paymentService.getAll();
    this.paginationMeta = this.paymentService.paginationMeta;
    this.loading = this.paymentService.loading;
    this.completedCount = computed(() => this.statusCounts().completed);
    this.pendingCount = computed(() => this.statusCounts().pending);
    this.cancelledCount = computed(() => this.statusCounts().failed);
    this.refundCount = computed(() => this.statusCounts().refunded);

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });

    this.loadStatusCounts();
  }

  private loadStatusCounts(): void {
    this.paymentService.getCounts().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.statusCounts.set({
          total: data.total ?? 0,
          pending: data.pending ?? 0,
          completed: data.completed ?? 0,
          failed: data.failed ?? 0,
          refunded: data.refunded ?? 0,
        });
        this.totalCount.set(data.total ?? 0);
      },
      error: () => this.message.error('Failed to load payment counts'),
    });
  }
}
