import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { InvoiceService } from 'src/app/core/services/invoiceService';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';
import { InvoiceTemplateService } from 'src/app/core/services/invoiceTemplate.service';
import {
  DEFAULT_INVOICE_SETTINGS,
  InvoiceTemplateSettings,
  SampleInvoiceData,
  buildInvoiceCss,
  buildInvoiceBody,
  buildInvoiceDocument,
  invoiceCssVars,
} from 'src/app/features/invoices/invoice-doc';

export interface InvoiceDetailData {
  invoice: any;
}

@Component({
  selector: 'app-invoice-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NzButtonModule],
  templateUrl: './invoice-detail-modal.component.html',
  styleUrl: './invoice-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailModalComponent {
  private readonly sanitizer = inject(DomSanitizer);

  private readonly _data = signal<InvoiceDetailData>({ invoice: {} });

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: InvoiceDetailData) {
    this._data.set(value ?? { invoice: {} });
    this.invoice.set(this.normalizeInvoice(value?.invoice ?? {}));
  }
  get data(): InvoiceDetailData {
    return this._data();
  }

  readonly invoice = signal<any>({});
  readonly company = signal<any>({});
  readonly totals = computed(() => this.calculateTotals(this.invoice()));

  readonly template = signal<InvoiceTemplateSettings>({ ...DEFAULT_INVOICE_SETTINGS });
  readonly docStyle = this.sanitizer.bypassSecurityTrustHtml(
    `<style>${buildInvoiceCss()}</style>`,
  );
  readonly printHtml = computed(() => {
    const s = this.template();
    const inv = this.invoice();
    const data = this.buildInvoiceData(inv);
    const vars = Object.entries(invoiceCssVars(s))
      .map(([k, v]) => `${k}:${v};`)
      .join('');
    return this.sanitizer.bypassSecurityTrustHtml(
      `<div class="inv-doc l-${s.layout}" style="${vars}">${buildInvoiceBody(s, data)}</div>`,
    );
  });

  constructor(
    private readonly modalRef: NzModalRef,
    private readonly invoiceService: InvoiceService,
    private readonly message: NzMessageService,
    private readonly invoiceTemplateService: InvoiceTemplateService,
  ) {
    this.loadActiveTemplate();
  }

  private loadActiveTemplate(): void {
    this.invoiceTemplateService.getActive().subscribe({
      next: (t) => {
        this.template.set(
          t?.settings
            ? { ...DEFAULT_INVOICE_SETTINGS, ...t.settings }
            : { ...DEFAULT_INVOICE_SETTINGS },
        );
      },
      error: () => this.template.set({ ...DEFAULT_INVOICE_SETTINGS }),
    });
  }

  close(): void {
    this.modalRef.close();
  }

  printInvoice(): void {
    const s = this.template();
    const data = this.buildInvoiceData(this.invoice());

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
    win.document.write(buildInvoiceDocument(s, data));
    win.document.close();
    setTimeout(doPrint, 400);
  }

  sendInvoice(): void {
    const id = this.invoice().id;
    if (!id) {
      this.message.error('No invoice id found');
      return;
    }
    this.invoiceService.send(id).subscribe({
      next: () => {
        this.message.success('Invoice marked as sent');
        this.invoice.update((i) => ({ ...i, status: 'Sent', statusType: 'info' }));
      },
      error: () => this.message.error('Failed to send invoice'),
    });
  }

  downloadInvoice(): void {
    this.message.success('Invoice download started');
  }

  private normalizeInvoice(raw: any): any {
    const items = (raw?.items || raw?.invoiceItems || []).map((item: any, i: number) => ({
      no: i + 1,
      product: item.productName || item.name || item.product || 'Product',
      qty: +(item.quantity || item.qty || 0),
      unitPrice: +(item.unitPrice || item.price || 0),
      total: +(item.totalPrice || item.total || item.lineTotal || 0),
    }));

    const subtotal = +(raw?.subtotal ?? items.reduce((sum: number, item: any) => sum + item.total, 0));
    const tax = +(raw?.tax ?? (subtotal * 0.18));
    const shipping = +(raw?.shipping ?? raw?.shippingFee ?? 0);
    const discount = +(raw?.discount ?? 0);
    const totalAmount = +(raw?.totalAmount ?? raw?.total ?? (subtotal + tax + shipping - discount));

    return {
      ...raw,
      id: raw?.id,
      invoiceNumber: raw?.invoiceNumber || raw?.id,
      orderNumber: raw?.orderNumber || raw?.order?.orderNumber || raw?.orderId,
      customer: raw?.customer || raw?.customerName || raw?.order?.customer,
      email: raw?.customerEmail || raw?.email || raw?.order?.email,
      phone: raw?.customerPhone || raw?.phone || raw?.order?.phone,
      date: formatDateTime(raw?.invoiceDate || raw?.createdAt),
      dueDate: formatDateTime(raw?.dueDate),
      status: this.formatStatus(raw?.status || 'generated'),
      statusType: this.getStatusType(raw?.status || 'generated'),
      paymentStatus: this.formatStatus(raw?.paymentStatus || 'pending'),
      paymentStatusType: this.getPaymentStatusType(raw?.paymentStatus || 'pending'),
      paymentMethod: raw?.paymentMethod || raw?.order?.paymentMethod || '—',
      totalAmount,
      subtotal,
      tax,
      shipping,
      discount,
      items,
      billingAddress: this.normalizeAddress(raw?.billingAddress),
      shippingAddress: this.normalizeAddress(raw?.shippingAddress),
    };
  }

  private normalizeAddress(addr: any): any {
    if (!addr) return undefined;
    return {
      fullName: addr.fullName || addr.name || '',
      address: addr.addressLine1 || addr.address || '',
      city: addr.district || addr.city || '',
      province: addr.province || addr.state || '',
      postalCode: addr.postalCode || addr.zip || '',
      country: addr.country || 'Sri Lanka',
      phone: addr.phone || '',
    };
  }

  private buildInvoiceData(inv: any): SampleInvoiceData {
    const items = (inv?.items || []).map((it: any) => ({
      no: +(it.no || 0),
      name: it.product || 'Product',
      qty: +(it.qty || it.quantity || 0),
      unitPrice: +(it.unitPrice || 0),
      total: +(it.total || it.totalPrice || 0),
    }));

    return {
      invoiceId: inv?.invoiceNumber || inv?.id || '—',
      date: inv?.date || '—',
      dueDate: inv?.dueDate || '—',
      orderNumber: inv?.orderNumber || '—',
      customerName: inv?.customer || 'Customer',
      customerEmail: inv?.email || '',
      customerPhone: inv?.phone || '',
      status: inv?.status || '—',
      items,
      subtotal: +(inv?.subtotal || 0),
      tax: +(inv?.tax || 0),
      shipping: +(inv?.shipping || 0),
      total: +(inv?.totalAmount || 0),
    };
  }

  private calculateTotals(i: any): any {
    const subtotal = +(i?.subtotal || 0);
    const tax = +(i?.tax || 0);
    const shipping = +(i?.shipping || 0);
    const discount = +(i?.discount || 0);
    return { subtotal, tax, shipping, discount, total: subtotal + tax + shipping - discount };
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
