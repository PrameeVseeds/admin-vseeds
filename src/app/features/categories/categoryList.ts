import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LucideAngularModule } from 'lucide-angular';
import { CategoryService } from 'src/app/core/services/category.service';
import { ProductService, Product } from 'src/app/core/services/product.service';
import { ProductDetailsComponent } from '../products/product-details/product-details.component';
import { openModal, openConfirm } from 'src/app/shared/utils/modal-helpers';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DecimalPipe,
    NzTooltipModule,
    NzModalModule,
    LucideAngularModule,
  ],
  templateUrl: './categoryList.html',
  styleUrl: './categoryList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent {
  protected readonly categories: any;
  protected readonly searchTerm = signal('');
  protected readonly expandedId = signal<string | null>(null);
  protected readonly categoryProducts = signal<Product[]>([]);
  protected readonly loadingProducts = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly hasMoreProducts = signal(false);
  protected readonly productPage = signal(1);
  private readonly productLimit = 20;
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 5;

  protected readonly activeCount: any;
  protected readonly inactiveCount: any;
  protected readonly totalProducts: any;
  protected readonly filteredCategories: any;
  protected readonly totalPages: any;
  protected readonly paginatedCategories: any;
  protected readonly pageNumbers: any;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly modalService: NzModalService,
    private readonly router: Router,
  ) {
    this.categories = this.categoryService.getAll();
    this.activeCount = computed(
      () => this.categories().filter((c: any) => c.status === 'Active' || c.status === 'active').length,
    );
    this.inactiveCount = computed(
      () => this.categories().filter((c: any) => c.status !== 'Active' && c.status !== 'active').length,
    );
    this.totalProducts = computed(() =>
      this.categories().reduce((sum: number, c: any) => sum + (c.products ?? 0), 0),
    );
    this.filteredCategories = computed(() => {
      const term = this.searchTerm().toLowerCase().trim();
      if (!term) return this.categories();
      return this.categories().filter(
        (c: any) =>
          c.name.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term),
      );
    });
    this.totalPages = computed(() =>
      Math.max(1, Math.ceil(this.filteredCategories().length / this.pageSize)),
    );
    this.paginatedCategories = computed(() => {
      const filtered = this.filteredCategories();
      const page = Math.min(this.currentPage(), this.totalPages());
      const start = (page - 1) * this.pageSize;
      return filtered.slice(start, start + this.pageSize);
    });
    this.pageNumbers = computed(() =>
      Array.from({ length: this.totalPages() }, (_, i) => i + 1),
    );
  }

  private loadProductCount(catId: string): void {
    this.productService.countByCategory(catId).subscribe({
      next: (res: any) => {
        const total = res?.data?.total ?? res?.total ?? 0;
        this.categories.update((list: any[]) =>
          list.map((cat: any) =>
            cat.id === catId ? { ...cat, products: total } : cat,
          ),
        );
      },
      error: () => {
        // Silently fail — count stays as-is
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  toggleExpand(cat: any): void {
    if (this.expandedId() === cat.id) {
      this.expandedId.set(null);
      this.categoryProducts.set([]);
      this.hasMoreProducts.set(false);
      this.productPage.set(1);
      return;
    }

    this.expandedId.set(cat.id);
    this.categoryProducts.set([]);
    this.productPage.set(1);
    this.hasMoreProducts.set(false);
    this.loadingProducts.set(true);
    this.loadProductCount(cat.id);

    this.productService.loadByCategory(cat.id, 1, this.productLimit).subscribe({
      next: (res: any) => {
        const raw = this.extractProducts(res);
        const total = this.extractTotal(res);
        this.categoryProducts.set(
          raw.map((p: any) => ({
            ...p,
            statusType: this.getStatusType(p.status),
          })),
        );
        // Show "Load more" if there are more products than what we loaded
        this.hasMoreProducts.set(this.categoryProducts().length < total);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.categoryProducts.set([]);
        this.loadingProducts.set(false);
      },
    });
  }

  loadMoreProducts(): void {
    const catId = this.expandedId();
    if (!catId) return;

    this.loadingMore.set(true);
    const nextPage = this.productPage() + 1;

    this.productService.loadByCategory(catId, nextPage, this.productLimit).subscribe({
      next: (res: any) => {
        const raw = this.extractProducts(res);
        const total = this.extractTotal(res);
        const mapped = raw.map((p: any) => ({
          ...p,
          statusType: this.getStatusType(p.status),
        }));
        this.categoryProducts.update((list: Product[]) => [...list, ...mapped]);
        this.productPage.set(nextPage);
        this.hasMoreProducts.set(this.categoryProducts().length < total);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  private extractTotal(res: any): number {
    const data = res?.data ?? res;
    if (data && typeof data === 'object') {
      if (typeof data.total === 'number') return data.total;
      if (typeof data.totalCount === 'number') return data.totalCount;
      if (typeof data.count === 'number') return data.count;
    }
    // Fall back to the number of returned items
    return this.extractProducts(res).length;
  }

  private extractProducts(res: any): any[] {
    const data = res?.data ?? res;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.products)) return data.products;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.data)) return data.data;
      const arrayProp = Object.values(data).find((v: any) => Array.isArray(v));
      if (arrayProp) return arrayProp as any[];
    }
    return [];
  }

  private getStatusType(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'draft': return 'warning';
      default: return 'info';
    }
  }

  deleteCategory(id: string): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Category',
      description:
        'Are you sure you want to delete this category? Note: Categories containing products cannot be deleted. If empty, the category and its icon will be removed permanently.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.categoryService.delete(id);
      }
    });
  }

  viewProduct(product: Product): void {
    this.productService.loadById(product.id).subscribe({
      next: (res: any) => {
        const full = res?.data || res || product;
        openModal(this.modalService, {
          content: ProductDetailsComponent,
          data: full,
          width: '800px',
          className: 'media-preview-modal',
          closable: true,
          maskClosable: true,
        });
      },
      error: () => {
        openModal(this.modalService, {
          content: ProductDetailsComponent,
          data: product,
          width: '800px',
          className: 'media-preview-modal',
          closable: true,
          maskClosable: true,
        });
      },
    });
  }

  editProduct(product: Product): void {
    this.router.navigate(['/products'], { queryParams: { edit: product.id } });
  }
}
