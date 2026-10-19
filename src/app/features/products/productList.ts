import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { ProductService, Product } from 'src/app/core/services/product.service';
import { CategoryService } from 'src/app/core/services/category.service';
import { DateTimePipe, DateOnlyPipe } from 'src/app/shared/pipes/date-format.pipe';
import { ProductModalsService } from './product-modals.service';
import { ProductFormComponent } from './components/product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzTooltipModule,
    NzModalModule,
    NzSwitchModule,
    LucideAngularModule,
    DateTimePipe,
    DateOnlyPipe,
    ProductFormComponent,
  ],
  providers: [NzMessageService, ProductModalsService],
  templateUrl: './productList.html',
  styleUrl: './productList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit, OnDestroy {
  protected readonly products: any;
  protected readonly paginationMeta: any;
  protected readonly categories: any;
  protected readonly searchQuery = signal('');
  pageSize = 20;

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  protected readonly activeCount: any;
  protected readonly outOfStockCount: any;
  protected readonly lowStockCount: any;

  readonly showForm = signal(false);
  readonly editingProduct = signal<Product | null>(null);

  constructor(
    protected readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    protected readonly productModals: ProductModalsService,
    private readonly route: ActivatedRoute,
    private readonly msg: NzMessageService,
  ) {
    this.products = this.productService.getAll();
    this.paginationMeta = this.productService.paginationMeta;
    this.categories = this.categoryService.getAll();
    this.activeCount = computed(
      () => this.products().filter((p: any) => p.status?.toLowerCase() === 'active').length,
    );
    this.outOfStockCount = computed(
      () => this.products().filter((p: any) => p.inHandQty === 0).length,
    );
    this.lowStockCount = computed(
      () => this.products().filter((p: any) => p.inHandQty > 0 && p.inHandQty <= 10).length,
    );
  }

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((search) => {
        this.productService.loadAll({ page: 1, limit: this.pageSize, search: search || undefined });
      });

    const editId = this.route.snapshot.queryParamMap.get('edit');
    if (editId) {
      this.productService.loadById(editId).subscribe({
        next: (res: any) => {
          const full = res?.data || res;
          if (full) {
            this.editingProduct.set(full);
            this.showForm.set(true);
          }
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  onPageChange(page: number): void {
    this.productService.loadAll({
      page,
      limit: this.pageSize,
      search: this.searchQuery() || undefined,
    });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.productService.loadAll({
      page: 1,
      limit: size,
      search: this.searchQuery() || undefined,
    });
  }

  openAddForm(): void {
    this.editingProduct.set(null);
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openEditForm(product: Product): void {
    this.productService.loadById(product.id).subscribe({
      next: (res: any) => {
        const full = res?.data || res || product;
        this.editingProduct.set(full);
        this.showForm.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.editingProduct.set(product);
        this.showForm.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  onFormSaved(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  onFormCancelled(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  toggleStatus(item: any, checked: boolean): void {
    const status = checked ? 'active' : 'inactive';
    const prev = { status: item.status, statusType: item.statusType };
    // Optimistic — switch stays in the new position immediately.
    this.patchProduct(item.id, {
      status,
      statusType: status === 'active' ? 'success' : 'error',
    });
    this.productService.updateStatus(item.id, { status }).subscribe({
      next: () => this.msg.success(`"${item.name}" is now ${status}`),
      error: (err) => {
        this.patchProduct(item.id, prev);
        this.msg.error(err?.error?.message || 'Failed to update status');
      },
    });
  }

  toggleFeatured(item: any, checked: boolean): void {
    const prev = item.isFeatured;
    this.patchProduct(item.id, { isFeatured: checked });
    this.productService.updateStatus(item.id, { isFeatured: checked }).subscribe({
      next: () =>
        this.msg.success(
          checked
            ? `"${item.name}" added to Featured (New Arrivals)`
            : `"${item.name}" removed from Featured`,
        ),
      error: (err) => {
        this.patchProduct(item.id, { isFeatured: prev });
        this.msg.error(err?.error?.message || 'Failed to update featured status');
      },
    });
  }

  private patchProduct(id: string, changes: Record<string, any>): void {
    this.productService.products.update((list: Product[]) =>
      list.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  }
}
