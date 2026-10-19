import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { BannerService } from 'src/app/core/services/bannerService';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
  BaseListTab,
} from '@shared/components/base-list/base-list.component';

type BannerItem = any;

@Component({
  selector: 'app-banner-list',
  standalone: true,
  imports: [
    NzModalModule,
    NzTooltipModule,
    LucideAngularModule,
    BaseListComponent,
  ],
  templateUrl: './bannerList.html',
  styleUrl: './bannerList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerListComponent {
  protected readonly totalCount = signal(0);
  protected readonly banners: any;
  protected readonly paginationMeta: any;
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly page = signal(1);
  pageSize = 10;

  protected readonly columns: BaseListColumn[] = [
    { key: 'promotion', label: 'Promotion' },
    { key: 'placement', label: 'Placement' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  protected readonly activeCount: any;
  protected readonly scheduledCount: any;
  protected readonly expiredCount: any;
  protected readonly statusTabs: any;
  protected readonly filteredBanners: any;
  protected readonly pagedBanners: any;

  getTabCount(status: string): number {
    const all = this.banners() ?? [];
    if (status === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return all.filter((b: any) =>
      String(b.status).toLowerCase().replace(/ /g, '_') === String(status).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  createBanner(): void {
    this.router.navigate(['/banners/create']);
  }

  protected onEdit(item: BannerItem): void {
    this.router.navigate(['/banners', item.id, 'edit']);
  }

  protected onDelete(item: BannerItem): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Banner',
      description:
        'Are you sure you want to delete this banner? This action will remove it from the homepage immediately.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.bannerService.delete(item.id);
        this.message.success(`Banner "${item.title}" deleted`);
      }
    });
  }

  toggleStatus(item: BannerItem): void {
    const isActivating = item.status !== 'Active';
    const modal = openConfirm(this.modalService, {
      title: isActivating ? 'Activate Banner' : 'Deactivate Banner',
      description: isActivating
        ? `Activate "${item.title}"? It will be visible on the website immediately.`
        : `Deactivate "${item.title}"? It will be hidden from the website.`,
      confirmText: isActivating ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel',
      iconName: isActivating ? 'eye' : 'eye-off',
    }, { width: '420px' });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.bannerService.updateStatus(item.id, isActivating);
        this.message.success(
          `Banner "${item.title}" ${isActivating ? 'activated' : 'deactivated'}`,
        );
      }
    });
  }

  exportBanners(): void {
    this.bannerService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Title', 'Position', 'Start Date', 'End Date', 'Clicks', 'Status'];
    const rows = data.map((b: any) => [
      `"${b.title}"`,
      b.position,
      b.startDate,
      b.endDate,
      b.clicks.toString(),
      b.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banners-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Banners exported successfully');
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.activeTab.set('all');
    this.page.set(1);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page.set(1);
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly router: Router,
    protected readonly bannerService: BannerService,
  ) {
    this.banners = this.bannerService.getAll();

    this.activeCount = computed(
      () => this.banners().filter((b: any) => b.status === 'Active').length,
    );
    this.scheduledCount = computed(
      () => this.banners().filter((b: any) => b.status === 'Scheduled').length,
    );
    this.expiredCount = computed(
      () => this.banners().filter((b: any) => b.status === 'Expired').length,
    );

    this.statusTabs = computed<BaseListTab[]>(() => [
      { label: 'All', value: 'all', count: this.getTabCount('all') },
      { label: 'Active', value: 'Active', count: this.getTabCount('Active') },
      { label: 'Scheduled', value: 'Scheduled', count: this.getTabCount('Scheduled') },
      { label: 'Expired', value: 'Expired', count: this.getTabCount('Expired') },
      { label: 'Inactive', value: 'Inactive', count: this.getTabCount('Inactive') },
    ]);

    this.filteredBanners = computed(() => {
      let list = this.banners() ?? [];
      const tab = this.activeTab();
      const query = this.searchTerm().toLowerCase().trim();

      if (tab !== 'all') {
        list = list.filter((b: any) => b.status === tab);
      }

      if (query) {
        list = list.filter(
          (b: any) =>
            (b.title || '').toLowerCase().includes(query) ||
            (b.position || '').toLowerCase().includes(query),
        );
      }

      return list;
    });

    this.pagedBanners = computed(() => {
      const all = this.filteredBanners();
      const start = (this.page() - 1) * this.pageSize;
      return all.slice(start, start + this.pageSize);
    });

    this.paginationMeta = computed(() => {
      const total = this.filteredBanners().length;
      return {
        total,
        totalPages: Math.max(1, Math.ceil(total / this.pageSize)),
        page: this.page(),
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
