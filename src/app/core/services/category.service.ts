import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { Category } from '@models/category.model';
import { CdnService } from './cdnService';

export type { Category };

@Injectable({ providedIn: 'root' })
export class CategoryService extends ApiService {
  readonly categories = signal<Category[]>([]);

  private readonly DEFAULT_CATEGORY_ICON: string;

  private _loaded = false;

  constructor(
    http: HttpClient,
    private readonly message: NzMessageService,
    private readonly cdn: CdnService,
  ) {
    super(http);
    this.DEFAULT_CATEGORY_ICON = this.cdn.defaultImage('general/default-category-img.png');
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.categories;
  }

  getById(id: string): Category | undefined {
    return this.categories().find((c: any) => c.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`categories/${id}`);
  }

  loadAll() {
    this.loadData(
      this.get<any>('categories/all?limit=1000'),
      this.categories,
      (cat: any) => this.mapCategory(cat),
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('categories/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapCategory(x))),
    );
  }

  private mapCategory(cat: any): Category {
    return {
      ...cat,
      icon: this.cdn.normalizeImageUrl(cat.icon, this.DEFAULT_CATEGORY_ICON),
    };
  }

  add(category: Omit<Category, 'id'>) {
    return this.post<any>('categories/add', category).pipe(tap(() => this.loadAll()));
  }

  update(id: string, category: Partial<Category>) {
    return this.put<any>(`categories/update/${id}`, category).pipe(tap(() => this.loadAll()));
  }

  delete(id: string) {
    this.del<any>(`categories/delete/${id}`).subscribe({
      next: (res) => {
        this.categories.update((list: Category[]) => list.filter((c: Category) => c.id !== id));
        this.message.success(res?.message || 'Category deleted successfully');
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Failed to delete category');
      },
    });
  }
}
