import { Injectable } from '@angular/core';
import { ApiService } from './apiService';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.models';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class EmailSendService extends ApiService {
  send(
    to: string,
    templateSlug: string,
    variables: Record<string, string>,
  ): Observable<ApiResponse<any>> {
    return this.post<any>('email/send', { to, templateSlug, variables });
  }

  constructor(http: HttpClient) {
    super(http);
  }
}
