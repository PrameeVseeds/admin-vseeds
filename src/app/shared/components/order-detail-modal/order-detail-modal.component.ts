import { Component, ChangeDetectionStrategy, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { InvoiceService } from 'src/app/core/services/invoiceService';
import { InvoiceDetailModalComponent } from '../invoice-detail-modal/invoice-detail-modal.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

export interface OrderLineItem {
  product: string;
  storeId?: string;
  store: string;
  qty: number;
  unitPrice?: number;
  total: string;
}

export interface OrderShipment {
  method: string;
  tracking: string;
  estimatedDate: string;
}

export interface OrderDetailData {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  items: number;
  amount: string;
  status: string;
  statusType: string;
  address: string;
  shippingFee?: number;
  lineItems: OrderLineItem[];
  shipment: OrderShipment;
}

interface TimelineStep {
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NzButtonModule, NzTableModule, NzTooltipModule],
  templateUrl: './order-detail-modal.component.html',
  styleUrl: './order-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailModalComponent {
  private readonly _data = signal<any>(null);

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  @Input() set data(value: any) {
    this._data.set(value);
    if (value?.id) this.loadInvoice();
  }
  get data(): any { return this._data(); }

  readonly timeline = computed(() => this.buildTimeline());
  readonly invoice = signal<any>(null);
  readonly loadingInvoice = signal(false);
  readonly hasInvoice = computed(() => !!this.invoice());

  constructor(
    private readonly modalRef: NzModalRef,
    private readonly invoiceService: InvoiceService,
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
  ) {}

  close(): void {
    this.modalRef.close();
  }

  printInvoice(): void {
    this.modalRef.close({ action: 'print', id: this.data.id });
  }

  downloadInvoice(): void {
    this.modalRef.close({ action: 'download', id: this.data.id });
  }

  copyTracking(): void {
    if (this.data?.shipment?.tracking) {
      navigator.clipboard.writeText(this.data.shipment.tracking);
    }
  }

  loadInvoice(): void {
    if (!this.data?.id) return;
    this.loadingInvoice.set(true);
    this.invoiceService.getByOrderId(this.data.id).subscribe({
      next: (res: any) => {
        this.loadingInvoice.set(false);
        this.invoice.set(res || null);
      },
      error: () => {
        this.loadingInvoice.set(false);
        this.invoice.set(null);
      },
    });
  }

  generateInvoice(): void {
    if (!this.data?.id) return;
    this.loadingInvoice.set(true);
    this.invoiceService.generate(this.data.id).subscribe({
      next: (res: any) => {
        this.loadingInvoice.set(false);
        const inv = res?.data ?? res;
        this.invoice.set(inv);
        this.message.success('Invoice generated successfully');
        this.viewOrderInvoice(inv);
      },
      error: () => {
        this.loadingInvoice.set(false);
        this.message.error('Failed to generate invoice');
      },
    });
  }

  viewOrderInvoice(inv?: any): void {
    const invoice = inv || this.invoice();
    if (!invoice) return;
    openModal(this.modalService, {
      content: InvoiceDetailModalComponent,
      data: { invoice },
      width: '800px',
      className: 'invoice-detail-modal',
    });
  }

  printOrderInvoice(): void {
    this.viewOrderInvoice();
  }

  downloadOrderInvoice(): void {
    this.message.success('Invoice download started');
  }

  sendOrderInvoice(): void {
    const inv = this.invoice();
    if (!inv?.id) return;
    this.invoiceService.send(inv.id).subscribe({
      next: () => {
        this.message.success('Invoice marked as sent');
        this.loadInvoice();
      },
      error: () => this.message.error('Failed to send invoice'),
    });
  }

  formatInvoiceDate(value: string | Date | null): string {
    return formatDateTime(value);
  }

  private buildTimeline(): TimelineStep[] {
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    let status = this.data?.status || '';
    if (status === 'Waiting For Payment') status = 'Pending';
    const currentIndex = statusOrder.indexOf(status);
    const isCancelled = status === 'Cancelled';

    const steps: TimelineStep[] = [
      { label: 'Pending', icon: 'clock', completed: false, active: false },
      { label: 'Processing', icon: 'settings', completed: false, active: false },
      { label: 'Shipped', icon: 'truck', completed: false, active: false },
      { label: 'Delivered', icon: 'check-circle', completed: false, active: false },
    ];

    if (isCancelled) {
      return steps.map((s: any, i: any) => ({ ...s, completed: i === 0, active: false }));
    }

    return steps.map((s: any, i: any) => ({
      ...s,
      completed: i <= currentIndex,
      active: i === currentIndex,
    }));
  }
}
