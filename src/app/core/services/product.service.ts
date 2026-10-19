import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Product } from '@models/product.model';
import { CdnService } from './cdnService';

export type { Product };

@Injectable({ providedIn: 'root' })
export class ProductService extends ApiService {
  readonly products = signal<Product[]>([]);
  readonly paginationMeta = signal<PaginationMeta>({ total: 0, totalPages: 1, page: 1 });

  private readonly DEFAULT_PRODUCT_IMAGE: string;

  private _loaded = false;

  constructor(
    http: HttpClient,
    private readonly cdn: CdnService,
  ) {
    super(http);
    this.DEFAULT_PRODUCT_IMAGE = this.cdn.defaultImage('general/default-project-img.png');
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.products;
  }

  getById(id: string): Product | undefined {
    return this.products().find((p: Product) => p.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`products/${id}`);
  }

  loadAttributes() {
    return this.get<any>('products/attributes');
  }

  loadByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    let httpParams = this.buildParams({ page, limit });
    httpParams = httpParams.set('view', 'admin').set('categoryId', categoryId);
    return this.get<any>('products/all', httpParams);
  }

  /**
   * Fetches only the total product count for a category (limit=1 to minimize payload).
   * Returns an observable of the total count.
   */
  countByCategory(categoryId: string) {
    let httpParams = this.buildParams({ page: 1, limit: 1 });
    httpParams = httpParams.set('view', 'admin').set('categoryId', categoryId);
    return this.get<any>('products/all', httpParams);
  }

  loadAll(params?: PaginationParams) {
    let httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    httpParams = httpParams.set('view', 'admin');
    this.loadData(
      this.get<any>('products/all', httpParams),
      this.products,
      (p: any) => this.mapProduct(p),
      this.paginationMeta,
    );
  }

  private mapProduct(p: any): Product {
    return {
      ...p,
      thumbnailImage: this.cdn.normalizeImageUrl(p.thumbnailImage, this.DEFAULT_PRODUCT_IMAGE),
      images: this.cdn.normalizeImages(p.images, this.DEFAULT_PRODUCT_IMAGE),
      otherImages: this.cdn.normalizeImages(p.otherImages, this.DEFAULT_PRODUCT_IMAGE),
      statusType: this.getStatusType(p.status),
    };
  }

  private getStatusType(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
      case 'discontinued':
        return 'error';
      case 'out_of_stock':
        return 'warning';
      case 'draft':
        return 'warning';
      default:
        return 'info';
    }
  }

  add(formData: FormData) {
    return this.postForm<any>('products/add', formData);
  }

  update(id: string, formData: FormData) {
    return this.putForm<any>(`products/update/${id}`, formData);
  }

  updateStatus(
    id: string,
    body: { status?: string; isFeatured?: boolean; quantityInHand?: number },
  ) {
    return this.put<any>(`products/status/${id}`, body);
  }

  delete(id: string) {
    this.del<any>(`products/delete/${id}`).subscribe({
      next: () => this.products.update((list: Product[]) => list.filter((p: Product) => p.id !== id)),
    });
  }
}
