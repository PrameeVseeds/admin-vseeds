import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { Bank, BankResponse } from '../models/bank.model';

@Injectable({ providedIn: 'root' })
export class BankService {
  private readonly apiUrl = `${environment.apiBaseUrl}/banks`;

  getAll(): Observable<Bank[]> {
    return this.http.get<BankResponse>(this.apiUrl).pipe(map((res) => res.data as Bank[]));
  }

  getActive(): Observable<Bank[]> {
    return this.http
      .get<BankResponse>(`${this.apiUrl}/active`)
      .pipe(map((res) => res.data as Bank[]));
  }

  getById(id: string): Observable<Bank> {
    return this.http.get<BankResponse>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data as Bank));
  }

  create(bank: Bank): Observable<Bank> {
    return this.http.post<BankResponse>(this.apiUrl, bank).pipe(map((res) => res.data as Bank));
  }

  update(id: string, bank: Partial<Bank>): Observable<Bank> {
    return this.http
      .patch<BankResponse>(`${this.apiUrl}/${id}`, bank)
      .pipe(map((res) => res.data as Bank));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

    constructor(private readonly http: HttpClient) {
    }
}
