import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Faq } from '@models/faq.model';

@Injectable({ providedIn: 'root' })
export class FaqService extends ApiService {
  readonly faqs = signal<Faq[]>([]);

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.faqs;
  }
  getById(id: string): Faq | undefined {
    return this.faqs().find((f: Faq) => f.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`faqs/${id}`);
  }

  loadAll() {
    this.loadData(
      this.get<any>('faqs/all?limit=10'),
      this.faqs,
      (f: any) => this.mapFaq(f),
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('faqs/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapFaq(x))),
    );
  }

  private mapFaq(f: any): Faq {
    return {
      ...f,
      order: f.displayOrder || 0,
      status: f.isActive ? 'Active' : 'Inactive',
      statusType: f.isActive ? 'success' : 'error',
    };
  }

  add(faq: any) {
    return this.post<any>('faqs/add', faq).pipe(tap(() => this.loadAll()));
  }

  update(id: string, faq: any) {
    return this.put<any>(`faqs/update/${id}`, faq).pipe(tap(() => this.loadAll()));
  }

  delete(id: string) {
    this.del<any>(`faqs/delete/${id}`).subscribe({
      next: () => this.faqs.update((list: Faq[]) => list.filter((f: Faq) => f.id !== id)),
    });
  }
}
