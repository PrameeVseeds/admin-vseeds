import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PromoCodeService, PromoCode } from 'src/app/core/services/promoCodeService';
import { format, parseISO, isValid } from 'date-fns';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
  BaseListTab,
} from '@shared/components/base-list/base-list.component';

@Component({
  selector: 'app-promo-code-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NzModalModule,
    NzTooltipModule,
    NzSwitchModule,
    LucideAngularModule,
    BaseListComponent,
  ],
  templateUrl: './promoCodeList.html',
  styleUrl: './promoCodeList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoCodeListComponent {
  protected readonly totalCount = signal(0);
  protected readonly promoCodes = signal<PromoCode[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly stats = signal({ total: 0, active: 0, inactive: 0, expired: 0 });
  protected readonly loading = signal(false);
  protected readonly page = signal(1);
  protected pageSize = 10;

  private readonly statusTabOptions: BaseListTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Expired', value: 'expired' },
  ];

  protected readonly statusTabs = computed(() =>
    this.statusTabOptions.map((t) => ({ ...t, count: this.getTabCount(t.value) })),
  );

  protected readonly columns: BaseListColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'discount', label: 'Discount' },
    { key: 'site', label: 'Site' },
    { key: 'usage', label: 'Usage' },
    { key: 'validPeriod', label: 'Valid Period' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly filteredCodes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const tab = this.activeTab();
    let list = this.promoCodes();

    if (tab === 'active') list = list.filter((p) => p.isActive && !this.isExpired(p));
    else if (tab === 'inactive') list = list.filter((p) => !p.isActive);
    else if (tab === 'expired') list = list.filter((p) => this.isExpired(p));

    if (term) {
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(term) ||
          (p.description || '').toLowerCase().includes(term),
      );
    }
    return list;
  });

  protected readonly pagedCodes = computed(() => {
    const all = this.filteredCodes();
    const start = (this.page() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  protected readonly paginationMeta = computed(() => {
    const total = this.filteredCodes().length;
    return {
      total,
      totalPages: Math.max(1, Math.ceil(total / this.pageSize)),
      page: this.page(),
    };
  });

  constructor(
    private readonly promoService: PromoCodeService,
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly router: Router,
  ) {
    this.loadData();

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }

  loadData() {
    this.loading.set(true);
    this.promoService.getAll(1, 100).subscribe({
      next: (res) => {
        this.promoCodes.set(res.promoCodes || []);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Failed to load promo codes');
        this.loading.set(false);
      },
    });
    this.promoService.getCount().subscribe({
      next: (res) => this.stats.set(res),
    });
  }

  getTabCount(tab: string): number {
    const list = this.promoCodes();
    if (tab === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    if (tab === 'active') return list.filter((p) => p.isActive && !this.isExpired(p)).length;
    if (tab === 'inactive') return list.filter((p) => !p.isActive).length;
    if (tab === 'expired') return list.filter((p) => this.isExpired(p)).length;
    return 0;
  }

  isExpired(p: PromoCode): boolean {
    if (!p.expiryDate) return false;
    return new Date(p.expiryDate) < new Date();
  }

  getSiteLabel(site: string): string {
    if (site === 'electronics') return 'Electronics';
    if (site === 'embedded') return 'Embedded / PCB';
    return 'Both Sites';
  }

  formatDiscount(p: PromoCode): string {
    return p.discountType === 'percentage'
      ? `${+p.discountValue}%`
      : `Rs. ${(+p.discountValue).toFixed(2)}`;
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    try {
      const parsed = parseISO(d);
      return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '—';
    } catch {
      return '—';
    }
  }

  formatDateTime(d: string | null): string {
    if (!d) return '—';
    try {
      const parsed = parseISO(d);
      return isValid(parsed) ? format(parsed, 'yyyy-MM-dd hh:mm a') : '—';
    } catch {
      return '—';
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
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

  onToggleActive(item: PromoCode, active: boolean) {
    this.promoService.update(item.id, { isActive: active } as any).subscribe({
      next: () => {
        this.message.success(`Promo code ${active ? 'activated' : 'deactivated'}`);
        this.loadData();
      },
      error: () => this.message.error('Failed to update status'),
    });
  }

  onEdit(item: PromoCode) {
    this.router.navigate(['/promo-codes', item.id, 'edit']);
  }

  onDelete(item: PromoCode) {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Promo Code',
      description: `Are you sure you want to delete "${item.code}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.promoService.delete(item.id).subscribe({
          next: () => {
            this.message.success('Promo code deleted');
            this.loadData();
          },
          error: () => this.message.error('Failed to delete promo code'),
        });
      }
    });
  }
}
