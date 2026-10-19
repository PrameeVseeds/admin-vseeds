import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Project } from '@models/project.model';
import { CdnService } from './cdnService';

@Injectable({ providedIn: 'root' })
export class ProjectService extends ApiService {
  readonly projects = signal<Project[]>([]);

  readonly DEFAULT_PROJECT_IMG: string;

  private _loaded = false;

  constructor(
    http: HttpClient,
    private readonly cdn: CdnService,
  ) {
    super(http);
    this.DEFAULT_PROJECT_IMG = this.cdn.defaultAsset('uploads/general/default-project-img.png');
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.projects;
  }
  getById(id: string): Project | undefined {
    return this.projects().find((p: Project) => p.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`projects/${id}`).pipe(
      tap((res: any) => {
        const project = res?.data ?? res;
        if (project) {
          project.imageUrl = this.cdn.ensureFullUrl(project.imageUrl, this.DEFAULT_PROJECT_IMG);
        }
      }),
    );
  }

  loadAll() {
    this.loadData(
      this.get<any>('projects'),
      this.projects,
      (p: any) => this.mapProject(p),
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('projects', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapProject(x))),
    );
  }

  private mapProject(p: any): Project {
    const status = p.isPublic ? 'Published' : 'Draft';
    const statusType = p.isPublic ? 'success' : 'neutral';

    return {
      ...p,
      status,
      statusType,
      imageUrl: this.cdn.ensureFullUrl(p.imageUrl, this.DEFAULT_PROJECT_IMG),
      client: p.client || 'Internal Project',
      category: p.category || 'General',
      technologies: Array.isArray(p.technologies) ? p.technologies.join(',') : p.technologies,
    };
  }

  add(project: any) {
    return this.post<any>('projects', project).pipe(tap(() => this.loadAll()));
  }

  update(id: string, project: any) {
    return this.put<any>(`projects/${id}`, project).pipe(tap(() => this.loadAll()));
  }

  delete(id: string) {
    this.del<any>(`projects/${id}`).subscribe({
      next: () => this.projects.update((list: Project[]) => list.filter((p: Project) => p.id !== id)),
    });
  }
}
