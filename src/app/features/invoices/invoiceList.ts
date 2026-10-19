// DEPRECATED: replaced by invoiceTemplate.ts / invoices.routes.ts. Not wired into any route.
// Please delete this file (and invoiceList.html / invoiceList.scss) manually — the assistant's
// tools could not remove files directly in this environment.
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { InvoiceService, InvoiceParams } from 'src/app/core/services/invoiceService';
import { DateTimePipe } from 'src/app/shared/pipes/date-format.pipe';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

type InvoiceItem = any;

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [DecimalPipe, BaseListComponent, NzTooltipModule, LucideAngularModule, DateTimePipe],
  templateUrl: './invoiceList.html',
  styleUrl: './invoiceList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceListComponent {
  protected readonly invoices: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  protected readonly activeTab = signal('all');
  protected readonly search = signal('');
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.paginationMeta().total },
    { label: 'Generated', value: 'generated', count: undefined },
    { label: 'Sent', value: 'sent', count: undefined },
    { label: 'Paid', value: 'paid', count: undefined },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Invoice Date' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'status', label: 'Status' },
  ];

  onSearchChange(value: string): void {
    this.search.set(value);
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
    const search = this.search().trim();
    const params: InvoiceParams = {
      page,
      limit: this.pageSize,
      status: tab !== 'all' ? tab : undefined,
      search: search || undefined,
    };
    this.invoiceService.loadAll(params);
  }

  viewInvoice(invoice: InvoiceItem): void {
    this.router.navigate(['/invoices', invoice.id]);
  }

  sendInvoice(invoice: InvoiceItem, event: Event): void {
    event.stopPropagation();
    this.invoiceService.send(invoice.id).subscribe({
      next: () => {
        this.message.success(`Invoice ${invoice.invoiceNumber} marked as sent`);
        this.invoiceService.loadAll({
          page: this.paginationMeta().page,
          limit: this.pageSize,
          status: this.activeTab() !== 'all' ? this.activeTab() : undefined,
          search: this.search().trim() || undefined,
        });
      },
      error: () => this.message.error('Failed to send invoice'),
    });
  }

  generateAll(): void {
    this.invoiceService.generateAll().subscribe({
      next: (res) => {
        this.message.success(`Generated ${res?.generated ?? 0} invoice(s)`);
        this.activeTab.set('all');
        this.invoiceService.loadAll({
          page: 1,
          limit: this.pageSize,
          status: undefined,
          search: undefined,
        });
      },
      error: () => this.message.error('Failed to generate invoices'),
    });
  }

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly message: NzMessageService,
    private readonly router: Router,
  ) {
    this.invoices = this.invoiceService.getAll();
    this.paginationMeta = this.invoiceService.paginationMeta;
    this.loading = this.invoiceService.loading;
  }
}
