import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PaginationParams } from './apiService';
import { environment } from '@env';
import { PromoCode } from '@models/promoCode.model';

export type { PromoCode };

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly apiUrl = `${environment.apiBaseUrl}/promo-codes`;

  constructor(private readonly http: HttpClient) {}

  getAll(page = 1, limit = 50): Observable<{ promoCodes: PromoCode[]; total: number }> {
    return this.http
      .get<any>(`${this.apiUrl}/all`, { params: { page, limit } })
      .pipe(map((res) => res.data ?? res));
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    return this.getAll(params?.page ?? 1, params?.limit ?? 9999).pipe(
      map((res: any) => res.promoCodes ?? res),
    );
  }

  getById(id: string): Observable<PromoCode> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data ?? res));
  }

  create(payload: Partial<PromoCode>): Observable<PromoCode> {
    return this.http.post<any>(`${this.apiUrl}/add`, payload).pipe(map((res) => res.data ?? res));
  }

  update(id: string, payload: Partial<PromoCode>): Observable<PromoCode> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((res) => res.data ?? res));
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getCount(): Observable<{ total: number; active: number; inactive: number; expired: number }> {
    return this.http.get<any>(`${this.apiUrl}/count`).pipe(map((res) => res.data ?? res));
  }
}
