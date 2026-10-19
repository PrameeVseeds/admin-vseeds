import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { DeliveryService } from 'src/app/core/services/deliveryService';
import { DeliveryDetailModalComponent } from 'src/app/shared/components/delivery-detail-modal/delivery-detail-modal.component';
import { AddDeliveryModalComponent } from 'src/app/shared/components/add-delivery-modal/add-delivery-modal.component';
import {
  StatusUpdateModalComponent,
  StatusOption,
} from 'src/app/shared/components/status-update-modal/status-update-modal.component';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';

type DeliveryItem = any;

const DELIVERY_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'Pending Pickup',
    label: 'Pending Pickup',
    icon: 'clock',
    color: '#f59e0b',
    bgClass: 'opt--warning',
  },
  {
    value: 'In Transit',
    label: 'In Transit',
    icon: 'navigation',
    color: '#3b82f6',
    bgClass: 'opt--info',
  },
  {
    value: 'Delivered',
    label: 'Delivered',
    icon: 'check-circle',
    color: '#10b981',
    bgClass: 'opt--success',
  },
];

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [BaseListComponent, NzTooltipModule, NzModalModule, LucideAngularModule],
  templateUrl: './deliveryList.html',
  styleUrl: './deliveryList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryListComponent {
  protected readonly totalCount = signal(0);
  protected readonly deliveries: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getStatusCount('all') },
    { label: 'Pending Pickup', value: 'Pending Pickup', count: this.getStatusCount('Pending Pickup') },
    { label: 'In Transit', value: 'In Transit', count: this.getStatusCount('In Transit') },
    { label: 'Delivered', value: 'Delivered', count: this.getStatusCount('Delivered') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'tracking', label: 'Tracking Info' },
    { key: 'customer', label: 'Customer' },
    { key: 'carrier', label: 'Carrier' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly inTransitCount: any;
  protected readonly deliveredCount: any;
  protected readonly pendingCount: any;

  getStatusCount(status: string): number {
    if (status === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return this.deliveries().filter((d: any) =>
      String(d.status).toLowerCase().replace(/ /g, '_') === String(status).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  onSearchChange(_value: string): void {
    this.deliveryService.loadAll({ page: 1, limit: this.pageSize });
  }

  onTabChange(_tab: string): void {
    this.deliveryService.loadAll({ page: 1, limit: this.pageSize });
  }

  onPageChange(page: number): void {
    this.deliveryService.loadAll({ page, limit: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.deliveryService.loadAll({ page: 1, limit: size });
  }

  private readonly statusTypeMap: Record<string, string> = {
    'Pending Pickup': 'warning',
    'In Transit': 'info',
    Delivered: 'success',
  };

  openStatusModal(delivery: DeliveryItem): void {
    const modal = openModal(this.modalService, {
      content: StatusUpdateModalComponent,
      data: {
        entityId: delivery.tracking,
        subtitle: delivery.customer,
        currentStatus: delivery.status,
        title: 'Update Delivery Status',
        options: DELIVERY_STATUS_OPTIONS,
      },
      width: '440px',
      className: 'status-update-modal',
    });

    modal.afterClose.subscribe((newStatus: string | null) => {
      if (newStatus && newStatus !== delivery.status) {
        this.deliveries.update((list: any) =>
          list.map((d: any) =>
            d.id === delivery.id
              ? { ...d, status: newStatus, statusType: this.statusTypeMap[newStatus] ?? 'info' }
              : d,
          ),
        );
        this.message.success(`${delivery.tracking} status updated to ${newStatus}`);
      }
    });
  }

  viewDelivery(delivery: DeliveryItem): void {
    openModal(this.modalService, {
      content: DeliveryDetailModalComponent,
      data: {
        id: delivery.id,
        tracking: delivery.tracking,
        order: delivery.order,
        customer: delivery.customer,
        carrier: delivery.carrier,
        shipped: delivery.shipped,
        estimated: delivery.estimated,
        status: delivery.status,
        statusType: delivery.statusType,
      },
      width: '540px',
      closable: true,
      className: 'delivery-detail-modal',
    });
  }

  exportDeliveries(): void {
    this.deliveryService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Tracking', 'Order', 'Customer', 'Carrier', 'Shipped', 'Estimated', 'Status'];
    const rows = data.map((d: any) => [
      d.tracking,
      d.order,
      d.customer,
      d.carrier,
      d.shipped,
      d.estimated,
      d.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deliveries-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Deliveries exported successfully');
    });
  }

  addDelivery(): void {
    const modal = openModal(this.modalService, {
      content: AddDeliveryModalComponent,
      width: '580px',
      className: 'add-delivery-modal',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result && result.order) {
        this.deliveryService.createShipment(result.order, {
          trackingNumber: result.tracking,
          carrier: result.carrier,
          shippedAt: result.shipped,
          expectedDeliveryAt: result.estimated,
        }).subscribe({
          next: () => {
            this.deliveryService.loadAll();
            this.message.success(`Delivery ${result.tracking} added successfully`);
          },
          error: () => this.message.error('Failed to create shipment'),
        });
      }
    });
  }

  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
  ) {
    this.deliveries = this.deliveryService.getAll();
    this.paginationMeta = this.deliveryService.paginationMeta;
    this.loading = this.deliveryService.loading;
    this.inTransitCount = computed(
      () => this.deliveries().filter((d: any) => d.status === 'In Transit').length,
    );
    this.deliveredCount = computed(
      () => this.deliveries().filter((d: any) => d.status === 'Delivered').length,
    );
    this.pendingCount = computed(
      () => this.deliveries().filter((d: any) => d.status === 'Pending Pickup').length,
    );

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
