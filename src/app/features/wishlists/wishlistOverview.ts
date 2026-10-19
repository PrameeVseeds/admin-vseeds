import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { WishlistService } from 'src/app/core/services/wishlistService';

@Component({
  selector: 'app-wishlist-overview',
  standalone: true,
  imports: [LucideAngularModule, NzTooltipModule, NzPaginationModule],
  templateUrl: './wishlistOverview.html',
  styleUrl: './wishlistOverview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistOverviewComponent {
  protected readonly wishlists: any;
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal('all');

  readonly stockTabs = [
    { label: 'All', value: 'all' },
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Out of Stock', value: 'Out of Stock' },
  ];

  protected readonly filteredWishlists: any;

  getTabCount(stock: string): number {
    if (stock === 'all') return this.wishlists().length;
    return this.wishlists().filter((w: any) => w.stock === stock).length;
  }

  exportWishlists(): void {
    const data = this.filteredWishlists();
    const headers = ['Product', 'SKU', 'Stock Status', 'Wish Count'];
    const rows = data.map((w: any) => [`"${w.product}"`, `"${w.sku ?? ''}"`, w.stock, w.count]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wishlists-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Wishlists exported successfully');
  }

  constructor(
    private readonly message: NzMessageService,
    private readonly wishlistService: WishlistService,
  ) {
    this.wishlists = this.wishlistService.getAll();
    this.filteredWishlists = computed(() => {
      const allItems = this.wishlists();
      const tab = this.activeTab();
      const query = this.searchTerm().toLowerCase().trim();

      // API returns one row per product with aggregate count (wishlistCount → count in service)
      let list = allItems.map((item: any) => ({
        productId: item.productId || '',
        product: item.product || 'Unknown product',
        sku: item.sku,
        stock: item.stock,
        stockType: item.stockType,
        count: typeof item.count === 'number' ? item.count : Number(item.count) || 0,
      }));

      // 2. Filter by Tab (Stock)
      if (tab !== 'all') {
        list = list.filter((w: any) => w.stock === tab);
      }

      // 3. Filter by Search Query
      if (query) {
        list = list.filter(
          (w: any) =>
            (w.product || '').toLowerCase().includes(query) ||
            (w.sku || '').toLowerCase().includes(query) ||
            (w.productId || '').toLowerCase().includes(query),
        );
      }

      // Sort by count descending
      return list.sort((a: any, b: any) => b.count - a.count);
    });
  }
}
