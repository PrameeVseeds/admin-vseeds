import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './apiService';

@Injectable({ providedIn: 'root' })
export class InvoiceTemplateService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll(): Observable<any[]> {
    return this.get<any>('invoice-templates').pipe(
      map((res: any) => this.extractArray(res.data)),
    );
  }

  getActive(): Observable<any> {
    return this.get<any>('invoice-templates/active').pipe(
      map((res: any) => res?.data ?? res),
    );
  }

  getById(id: string): Observable<any> {
    return this.get<any>(`invoice-templates/${id}`).pipe(
      map((res: any) => res?.data ?? res),
    );
  }

  create(body: any): Observable<any> {
    return this.post<any>('invoice-templates', body).pipe(
      map((res: any) => res?.data ?? res),
    );
  }

  update(id: string, body: any): Observable<any> {
    return this.put<any>(`invoice-templates/${id}`, body).pipe(
      map((res: any) => res?.data ?? res),
    );
  }

  delete(id: string): Observable<any> {
    return this.del<any>(`invoice-templates/${id}`).pipe(
      map((res: any) => res?.data ?? res),
    );
  }

  activate(id: string): Observable<any> {
    return this.put<any>(`invoice-templates/${id}/activate`, {}).pipe(
      map((res: any) => res?.data ?? res),
    );
  }

  deactivate(id: string): Observable<any> {
    return this.put<any>(`invoice-templates/${id}/deactivate`, {}).pipe(
      map((res: any) => res?.data ?? res),
    );
  }
}
