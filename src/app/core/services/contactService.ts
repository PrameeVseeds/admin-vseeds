import { Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Contact } from '@models/contact.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class ContactService extends ApiService {
  readonly contacts = signal<Contact[]>([]);
  readonly paginationMeta = signal<PaginationMeta>({ total: 0, totalPages: 1, page: 1 });

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.contacts;
  }

  getById(id: string): Contact | undefined {
    return this.contacts().find((c: Contact) => c.id === id);
  }

  loadAll(params?: PaginationParams) {
    const httpParams = this.buildParams({ page: 1, limit: 20, ...params });
    this.loadData(
      this.get<any>('contact/all', httpParams),
      this.contacts,
      (c: any) => this.mapContact(c),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('contact/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapContact(x))),
    );
  }

  private mapContact(c: any): Contact {
    const status = c.status || 'new';
    return {
      ...c,
      date: formatDateTime(c.createdAt),
      status,
      statusType: this.getStatusType(status),
    };
  }

  private getStatusType(status: string): string {
    switch (status.toLowerCase()) {
      case 'replied': return 'success';
      case 'read': return 'processing';
      case 'new': return 'warning';
      case 'archived': return 'default';
      default: return 'info';
    }
  }

  updateStatus(id: string, status: string) {
    return this.put<any>(`contact/update-status/${id}`, { status });
  }

  reply(id: string, message: string) {
    return this.post<any>(`contact/reply/${id}`, { message });
  }

  delete(id: string) {
    return this.del<any>(`contact/delete/${id}`);
  }
}
