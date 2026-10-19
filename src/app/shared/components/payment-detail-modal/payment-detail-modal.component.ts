import { Component, ChangeDetectionStrategy, computed, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef, NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface PaymentDetailData {
  id: string;
  paymentNumber: string;
  order: string;
  customer: string;
  email: string;
  method: string;
  amount: number;
  referenceNumber: string;
  date: string;
  status: string;
  statusType: string;
}

interface TimelineStep {
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

const STATUS_ORDER = ['pending', 'completed'];

@Component({
  selector: 'app-payment-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NzButtonModule, NzModalModule],
  templateUrl: './payment-detail-modal.component.html',
  styleUrl: './payment-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetailModalComponent {
  private readonly _data = signal<PaymentDetailData>({} as PaymentDetailData);

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: PaymentDetailData) {
    this._data.set(value ?? ({} as PaymentDetailData));
  }
  get data(): PaymentDetailData {
    return this._data();
  }

  readonly timeline = computed<TimelineStep[]>(() => {
    const currentIndex = STATUS_ORDER.indexOf(this.data?.status);
    const steps: { label: string; icon: string }[] = [
      { label: 'pending', icon: 'clock' },
      { label: 'completed', icon: 'check-circle' },
    ];

    return steps.map((step: any, i: any) => ({
      ...step,
      completed: i < currentIndex,
      active: i === currentIndex,
    }));
  });

  receiptUrl: SafeResourceUrl | null = null;

  @ViewChild('receiptPreview', { static: false }) receiptPreview!: TemplateRef<unknown>;

  close(): void {
    this.modalRef.close();
  }

  buildReceiptHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${this.data.paymentNumber || this.data.id}</title>
  <style>
    @page { margin: 0; size: auto; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif; margin: 0; padding: 40px; color: #111827; background: #f3f4f6; }
    .receipt { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
    .receipt-header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #fff; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand h1 { margin: 0; font-size: 30px; letter-spacing: -1px; }
    .brand p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
    .receipt-meta { text-align: right; }
    .receipt-meta .number { font-size: 14px; opacity: 0.9; font-family: monospace; }
    .receipt-meta .date { font-size: 13px; opacity: 0.8; margin-top: 6px; }
    .receipt-body { padding: 40px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin: 0 0 10px; font-weight: 600; }
    .customer-grid { display: flex; gap: 40px; margin-bottom: 32px; }
    .customer-grid .col { flex: 1; min-width: 0; }
    .customer-grid .value { font-size: 15px; color: #1f2937; font-weight: 600; }
    .customer-grid .value.email { font-size: 13px; color: #6b7280; font-weight: 400; margin-top: 4px; }
    .summary-table { width: 100%; border-collapse: separate; border-spacing: 0 10px; margin-bottom: 24px; }
    .summary-table td { padding: 16px; background: #f9fafb; border-radius: 10px; }
    .summary-table td.label { width: 45%; color: #6b7280; font-size: 13px; font-weight: 500; }
    .summary-table td.value { text-align: right; font-weight: 600; color: #111827; font-size: 14px; }
    .summary-table tr:last-child td { background: #dcfce6; }
    .summary-table tr:last-child td.label { color: #166534; }
    .summary-table tr:last-child td.value { font-size: 20px; font-weight: 700; color: #166534; }
    .status-badge { display: inline-block; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
    .status-completed { background: #dcfce6; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .status-refunded { background: #e0e7ff; color: #3730a3; }
    .stamp { margin-left: auto; width: fit-content; border: 3px solid #16a34a; color: #16a34a; border-radius: 8px; padding: 10px 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; transform: rotate(-12deg); opacity: 0.8; }
    .footer { padding: 28px 40px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="receipt-header">
      <div class="brand">
        <h1>VSEEDS</h1>
        <p>Payment Receipt</p>
      </div>
      <div class="receipt-meta">
        <div class="number">${this.data.paymentNumber || this.data.id}</div>
        <div class="date">${this.data.date || '—'}</div>
      </div>
    </div>
    <div class="receipt-body">
      <div class="customer-grid">
        <div class="col">
          <div class="section-title">Billed To</div>
          <div class="value">${this.data.customer || '—'}</div>
          <div class="value email">${this.data.email || '—'}</div>
        </div>
        <div class="col">
          <div class="section-title">Order</div>
          <div class="value">${this.data.order || '—'}</div>
        </div>
      </div>
      <table class="summary-table">
        <tr><td class="label">Payment Method</td><td class="value">${this.data.method || '—'}</td></tr>
        <tr><td class="label">Reference Number</td><td class="value">${this.data.referenceNumber || '—'}</td></tr>
        <tr><td class="label">Status</td><td class="value"><span class="status-badge status-${this.data.status}">${this.data.status || '—'}</span></td></tr>
        <tr><td class="label">Total Paid</td><td class="value">Rs. ${(this.data.amount || 0).toFixed(2)}</td></tr>
      </table>
      ${this.data.status === 'completed' ? `<div class="stamp">Paid</div>` : ''}
    </div>
    <div class="footer">Thank you for your business with VSEEDS.</div>
  </div>
</body>
</html>`;
  }

  viewReceipt(): void {
    const html = this.buildReceiptHtml();
    const blob = new Blob([html], { type: 'text/html' });
    this.receiptUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
    this.modalService.create({
      nzTitle: 'Payment Receipt',
      nzContent: this.receiptPreview,
      nzWidth: '840px',
      nzStyle: { top: '24px' },
      nzFooter: null,
      nzClosable: true,
    });
  }

  downloadReceipt(): void {
    const html = this.buildReceiptHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
    this.message.success(`Receipt for ${this.data.id} ready to print`);
  }

    constructor(
      private readonly modalRef: NzModalRef,
      private readonly modalService: NzModalService,
      private readonly sanitizer: DomSanitizer,
      private readonly message: NzMessageService,
    ) {
    }
}
