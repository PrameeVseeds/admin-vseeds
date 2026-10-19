import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './apiService';
import { HttpClient } from '@angular/common/http';
import { EmailTemplate } from '@models/emailTemplate.model';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService extends ApiService {
  readonly templates = signal<EmailTemplate[]>([]);

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.templates;
  }
  getById(id: string): EmailTemplate | undefined {
    return this.templates().find((t: EmailTemplate) => t.id === id);
  }

  fetchById(id: string): Observable<EmailTemplate> {
    return this.get<any>(`email-templates/${id}`).pipe(map((res) => this.mapTemplate(res.data)));
  }

  loadAll() {
    this.loadData(
      this.get<any>('email-templates'),
      this.templates,
      (t: any) => this.mapTemplate(t),
    );
  }

  update(id: string, template: any): Observable<any> {
    const payload: any = {
      name: template.name,
      slug: template.slug,
      category: template.category,
      description: template.description,
      subject: template.subject,
      htmlBody: template.body,
      variables: template.variables,
      isActive: template.status === 'Active',
    };
    return this.put<any>(`email-templates/${id}`, payload).pipe(tap(() => this.loadAll()));
  }

  deleteTemplate(id: string): Observable<any> {
    return this.del<any>(`email-templates/${id}`).pipe(tap(() => this.loadAll()));
  }

  sendTestEmail(id: string): Observable<any> {
    return this.post<any>(`email-templates/send-test/${id}`, {});
  }

  private mapTemplate(t: any): EmailTemplate {
    return {
      ...t,
      body: t.htmlBody ?? t.body ?? '',
      status: t.isActive === false ? 'Inactive' : 'Active',
      lastModified: t.updatedAt
        ? formatDateTime(t.updatedAt)
        : (t.lastModified ?? ''),
      variables: t.variables ?? [],
    };
  }
}
