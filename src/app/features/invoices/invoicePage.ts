// DEPRECATED: replaced by invoiceTemplate.ts / invoices.routes.ts. Not wired into any route.
// Please delete this file (and invoicePage.html / invoicePage.scss) manually — the assistant's
// tools could not remove files directly in this environment.
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { InvoiceService } from 'src/app/core/services/invoiceService';
import { formatDateTime, DateTimePipe } from 'src/app/shared/pipes/date-format.pipe';

export interface InvoiceTemplateSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo: string | null;
  accentColor: string;
  notes: string;
  terms: string;
  taxLabel: string;
  taxRate: number;
  signatureName: string;
  signatureTitle: string;
}

const TEMPLATE_STORAGE_KEY = 'invoice_template_settings';

const DEFAULT_TEMPLATE: InvoiceTemplateSettings = {
  companyName: 'VSEEDS',
  companyAddress: 'No. 123, Main Street, Colombo, Sri Lanka',
  companyPhone: '+94 11 234 5678',
  companyEmail: 'info@vseeds.lk',
  companyLogo: null,
  accentColor: '#16a34a',
  notes: 'Thank you for your business. If you have any questions, please contact support.',
  terms: 'Payment is due within 14 days. Late payments may be subject to a surcharge.',
  taxLabel: 'Tax (18% VAT)',
  taxRate: 18,
  signatureName: 'Authorized Signatory',
  signatureTitle: 'VSEEDS Management',
};

@Component({
  selector: 'app-invoice-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, NzButtonModule, DateTimePipe],
  templateUrl: './invoicePage.html',
  styleUrl: './invoicePage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoiceService = inject(InvoiceService);
  private readonly message = inject(NzMessageService);

  readonly invoice = signal<any>({});
  readonly loading = signal(false);
  readonly totals = computed(() => this.calculateTotals(this.invoice()));

  readonly editMode = signal(false);
  readonly template = signal<InvoiceTemplateSettings>(this.loadTemplate());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.message.error('Invoice ID is missing');
      this.router.navigate(['/invoices']);
      return;
    }

    this.loading.set(true);
    this.invoiceService.getById(id).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (!data) {
          this.message.error('Invoice not found');
          this.router.navigate(['/invoices']);
          return;
        }
        this.invoice.set(this.normalizeInvoice(data));
      },
      error: (err) => {
        this.loading.set(false);
        this.message.error(err?.error?.message || 'Failed to load invoice');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/invoices']);
  }

  printInvoice(): void {
    this.editMode.set(false);
    setTimeout(() => window.print(), 0);
  }

  toggleEditMode(): void {
    this.editMode.update((v) => !v);
  }

  updateTemplateField<K extends keyof InvoiceTemplateSettings>(
    key: K,
    value: InvoiceTemplateSettings[K],
  ): void {
    this.template.update((t) => ({ ...t, [key]: value }));
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.updateTemplateField('companyLogo', reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.updateTemplateField('companyLogo', null);
  }

  saveTemplate(): void {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(this.template()));
      this.message.success('Invoice format saved');
      this.editMode.set(false);
    } catch {
      this.message.error('Failed to save invoice format');
    }
  }

  resetTemplate(): void {
    this.template.set({ ...DEFAULT_TEMPLATE });
    this.message.info('Reset to default format');
  }

  private loadTemplate(): InvoiceTemplateSettings {
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_TEMPLATE };
      return { ...DEFAULT_TEMPLATE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_TEMPLATE };
    }
  }

  sendInvoice(): void {
    const id = this.invoice().id;
    if (!id) {
      this.message.error('No invoice id found');
      return;
    }

    this.invoiceService.send(id).subscribe({
      next: () => {
        this.invoice.update((i) => ({ ...i, status: 'Sent', statusType: 'info' }));
        this.message.success('Invoice marked as sent');
      },
      error: () => this.message.error('Failed to send invoice'),
    });
  }

  private normalizeInvoice(value: any): any {
    const raw = value?.data ?? value;
    const rawItems = raw?.items || raw?.invoiceItems || [];
    const items = rawItems.map((item: any, i: number) => ({
      no: i + 1,
      product: item.productName || item.name || item.product || 'Product',
      qty: +(item.quantity || item.qty || 0),
      unitPrice: +(item.unitPrice || item.price || 0),
      total: +(item.totalPrice || item.total || item.lineTotal || 0),
    }));

    const subtotal = +(raw?.subtotal ?? items.reduce((sum: number, item: any) => sum + item.total, 0));
    const tax = +(raw?.taxAmount ?? raw?.tax ?? 0);
    const shipping = +(raw?.shippingFee ?? raw?.shipping ?? 0);
    const discount = +(raw?.discountAmount ?? raw?.discount ?? 0);
    const totalAmount = +(raw?.totalAmount ?? raw?.total ?? (subtotal + tax + shipping - discount));

    return {
      ...raw,
      id: raw?.id,
      invoiceNumber: raw?.invoiceNumber || raw?.id,
      orderNumber: raw?.orderNumber || raw?.order?.orderNumber || raw?.orderId,
      customer: raw?.customerName || raw?.customer || raw?.order?.customer,
      email: raw?.customerEmail || raw?.email || raw?.order?.email,
      phone: raw?.customerPhone || raw?.phone || raw?.order?.phone,
      date: formatDateTime(raw?.invoiceDate || raw?.createdAt),
      dueDate: raw?.dueDate ? formatDateTime(raw?.dueDate) : undefined,
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

  private calculateTotals(i: any): any {
    const subtotal = +(i?.subtotal || 0);
    const tax = +(i?.tax || 0);
    const shipping = +(i?.shipping || 0);
    const discount = +(i?.discount || 0);
    return {
      subtotal,
      tax,
      shipping,
      discount,
      taxLabel: this.template().taxLabel,
      total: subtotal + tax + shipping - discount,
    };
  }

  private formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private getStatusType(status: string): string {
    switch (status.toLowerCase().replace(/ /g, '_')) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'generated':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  }

  private getPaymentStatusType(status: string): string {
    switch (status.toLowerCase().replace(/ /g, '_')) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'info';
    }
  }
}
