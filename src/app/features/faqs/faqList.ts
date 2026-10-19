import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { FaqService } from 'src/app/core/services/faqService';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import { PaginationMeta } from 'src/app/core/services/apiService';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

type FaqItem = any;

@Component({
  selector: 'app-faq-list',
  standalone: true,
  imports: [RouterLink, BaseListComponent, NzModalModule, NzTooltipModule, LucideAngularModule],
  templateUrl: './faqList.html',
  styleUrl: './faqList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqListComponent {
  protected readonly totalCount = signal(0);
  protected readonly faqs: any;
  protected readonly loading: any;
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly currentPage = signal(1);
  pageSize = 10;

  protected readonly columns: BaseListColumn[] = [
    { key: 'question', label: 'Question' },
    { key: 'category', label: 'Category' },
    { key: 'site', label: 'Site' },
    { key: 'order', label: 'Order' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getTabCount('all') },
    { label: 'Active', value: 'Active', count: this.getTabCount('Active') },
    { label: 'Inactive', value: 'Inactive', count: this.getTabCount('Inactive') },
  ]);

  protected readonly activeCount: any;
  protected readonly inactiveCount: any;
  protected readonly categoryCount: any;
  protected readonly filteredFaqs: any;
  protected readonly paginatedFaqs: any;
  protected readonly paginationMeta: any;

  getSiteLabel(site: string): string {
    if (site === 'electronics') return 'Electronics';
    if (site === 'embedded') return 'Embedded / PCB';
    if (site === 'both') return 'Both Sites';
    return site ?? 'Both Sites';
  }

  getTabCount(tabValue: string): number {
    if (tabValue === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return this.faqs().filter((f: any) =>
      String(f.status).toLowerCase().replace(/ /g, '_') === String(tabValue).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage.set(1);
  }

  protected onEdit(item: FaqItem): void {
    this.router.navigate(['/faqs', item.id, 'edit']);
  }

  protected onDelete(item: FaqItem): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete FAQ',
      description:
        'Are you sure you want to delete this FAQ entry? This action will remove it from the support page immediately.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.faqService.delete(item.id);
        this.message.success('FAQ deleted successfully');
      }
    });
  }

  exportFaqs(): void {
    this.faqService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Question', 'Answer', 'Category', 'Site', 'Order', 'Status'];
    const rows = data.map((f: any) => [
      `"${f.question}"`,
      `"${f.answer}"`,
      f.category,
      f.site ?? 'both',
      f.order.toString(),
      f.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faqs-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('FAQs exported successfully');
    });
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly router: Router,
    private readonly faqService: FaqService,
  ) {
    this.faqs = this.faqService.getAll();
    this.loading = this.faqService.loading;
    this.activeCount = computed(
      () => this.faqs().filter((f: any) => f.status === 'Active').length,
    );
    this.inactiveCount = computed(
      () => this.faqs().filter((f: any) => f.status === 'Inactive').length,
    );
    this.categoryCount = computed(
      () => new Set(this.faqs().map((f: any) => f.category)).size,
    );
    this.filteredFaqs = computed(() => {
      const term = this.searchTerm().toLowerCase().trim();
      const tab = this.activeTab();

      let list = this.faqs();

      if (tab !== 'all') {
        list = list.filter((f: any) => f.status === tab);
      }

      if (term) {
        list = list.filter((f: any) =>
            f.question.toLowerCase().includes(term) ||
            f.answer.toLowerCase().includes(term) ||
            f.category.toLowerCase().includes(term) ||
            (f.site ?? '').toLowerCase().includes(term),
        );
      }

      return list;
    });
    this.paginatedFaqs = computed(() => {
      const list = this.filteredFaqs();
      const start = (this.currentPage() - 1) * this.pageSize;
      return list.slice(start, start + this.pageSize);
    });
    this.paginationMeta = computed((): PaginationMeta => {
      const total = this.filteredFaqs().length;
      return {
        total,
        page: this.currentPage(),
        totalPages: Math.ceil(total / this.pageSize) || 1,
      };
    });

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
