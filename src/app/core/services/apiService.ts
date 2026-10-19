import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '../models/api.models';

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  page: number;
}

@Injectable()
export abstract class ApiService {
  constructor(protected readonly http: HttpClient) {}
  protected readonly baseUrl = environment.apiBaseUrl;

  protected readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  protected readonly _error = signal<string | null>(null);
  readonly error = this._error.asReadonly();

  protected loadData<T>(
    request: Observable<ApiResponse<any>>,
    target: WritableSignal<T[]>,
    mapFn: (raw: any) => T,
    meta?: WritableSignal<PaginationMeta>,
  ): void {
    this._loading.set(true);
    this._error.set(null);
    request.subscribe({
      next: (res) => {
        const raw = this.extractArray(res.data);
        target.set(raw.map(mapFn));
        if (meta) meta.set(this.extractPaginationMeta(res.data));
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this._error.set(err?.error?.message || 'Failed to load data');
        target.set([]);
        if (meta) meta.set({ total: 0, totalPages: 1, page: 1 });
      },
    });
  }

  protected extractArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const arrayProp = Object.values(data).find((v: any) => Array.isArray(v));
      if (arrayProp) return arrayProp as any[];
    }
    return [];
  }

  protected extractPaginationMeta(data: any): PaginationMeta {
    return {
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 1,
      page: data?.page ?? 1,
    };
  }

  protected buildParams(params?: PaginationParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.status && params.status !== 'all')
      httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return httpParams;
  }

  protected get<T>(path: string, params?: HttpParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params });
  }

  protected post<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  protected put<T>(path: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${path}`, body);
  }

  protected del<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${path}`);
  }

  protected postForm<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData);
  }

  protected putForm<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData);
  }
}
