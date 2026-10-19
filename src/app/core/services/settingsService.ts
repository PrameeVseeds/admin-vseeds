import { Injectable, signal } from '@angular/core';
import { ApiService } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Settings } from '@models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService extends ApiService {
  readonly settings = signal<Settings>({});

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.settings;
  }

  loadAll() {
    this._loading.set(true);
    this._error.set(null);
    this.get<any>('settings').subscribe({
      next: (res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        const map: Record<string, any> = {};
        for (const row of rows) {
          if (!row?.key) continue;
          map[row.key] = this.castValue(row.value, row.valueType);
        }
        this.settings.set(map);
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this._error.set(err?.error?.message || 'Failed to load settings');
        this.settings.set({});
      },
    });
  }

  private castValue(value: string | null, type?: string): any {
    if (value == null) return null;
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return Number(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  update(key: string, value: any, group?: string) {
    const dto = { key, value: String(value), valueType: typeof value, group };
    this.put<any>('settings', dto).subscribe({ next: () => this.loadAll() });
  }

  bulkUpdate(data: Record<string, any>) {
    const settings = Object.entries(data)
      .filter(([, val]) => val !== '' && val != null)
      .map(([key, val]) => ({
        key,
        value: String(val),
        valueType:
          typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'string',
      }));
    this.post<any>('settings/bulk', { settings }).subscribe({ next: () => this.loadAll() });
  }

  // ── Database dumps ──────────────────────────────────────────────

  getDbDumps() {
    return this.get<any>('database/dumps');
  }

  getDbImportStatus() {
    return this.get<any>('database/import-status');
  }

  uploadDbDump(type: 'latest' | 'old', file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.postForm<any>(`database/upload/${type}`, fd);
  }

  importDbDump(type: 'latest' | 'old', clear = false) {
    return this.post<any>(`database/import/${type}${clear ? '?clear=true' : ''}`, {});
  }

  downloadDbBackup() {
    return this.http.get(`${this.baseUrl}/database/backup`, {
      responseType: 'blob',
    });
  }
}
