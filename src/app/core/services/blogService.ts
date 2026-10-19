import { Injectable, signal } from '@angular/core';
import { ApiService, PaginationMeta, PaginationParams } from './apiService';
import { tap, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Blog } from '@models/blog.model';
import { CdnService } from './cdnService';
import { formatDateOnly } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class BlogService extends ApiService {
  readonly blogs = signal<Blog[]>([]);
  readonly paginationMeta = signal<PaginationMeta>({ total: 0, totalPages: 1, page: 1 });

  private readonly DEFAULT_BLOG_IMAGE: string;

  private _loaded = false;

  constructor(
    http: HttpClient,
    private readonly cdn: CdnService,
  ) {
    super(http);
    this.DEFAULT_BLOG_IMAGE = this.cdn.defaultImage('general/default-blog-img.png');
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.blogs;
  }
  getById(id: string): Blog | undefined {
    return this.blogs().find((b: Blog) => b.id === id);
  }

  loadById(id: string) {
    return this.get<any>(`blogs/${id}`);
  }

  loadAll() {
    this.loadData(
      this.get<any>('blogs/all?limit=10'),
      this.blogs,
      (b: any) => this.mapBlog(b),
      this.paginationMeta,
    );
  }

  getAllForExport(params?: PaginationParams): Observable<any[]> {
    const httpParams = this.buildParams({ page: 1, limit: 9999, ...params });
    return this.get<any>('blogs/all', httpParams).pipe(
      map((res: any) => this.extractArray(res.data).map((x: any) => this.mapBlog(x))),
    );
  }

  private mapBlog(b: any): Blog {
    const rawStatus = b.status || 'draft';
    const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    let statusType = 'neutral';
    if (status === 'Published') statusType = 'success';
    if (status === 'Archived') statusType = 'warning';

    // Calculate approximate reading time
    const words = b.content ? b.content.trim().split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));

    return {
      ...b,
      coverImageUrl: this.cdn.normalizeImageUrl(b.coverImageUrl, this.DEFAULT_BLOG_IMAGE),
      status,
      statusType,
      published: b.publishedAt ? formatDateOnly(b.publishedAt) : '-',
      updated: b.updatedAt ? formatDateOnly(b.updatedAt) : '-',
      readTime: `${readTime} min read`,
    };
  }

  add(blog: any) {
    const payload = this.preparePayload(blog);
    return this.post<any>('blogs/add', payload).pipe(tap(() => this.loadAll()));
  }

  update(id: string, blog: any) {
    const payload = this.preparePayload(blog);
    return this.put<any>(`blogs/update/${id}`, payload).pipe(tap(() => this.loadAll()));
  }

  private preparePayload(blog: any) {
    // Only pick fields allowed by CreateBlogDto/UpdateBlogDto
    const payload: any = {
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      author: blog.author,
      status: blog.status?.toLowerCase(),
      coverImageUrl: blog.coverImageUrl,
      tags: blog.tags,
      publishedAt: blog.publishedAt,
    };

    // Remove undefined fields to keep the payload clean
    Object.keys(payload).forEach((key: any) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    return payload;
  }

  delete(id: string) {
    this.del<any>(`blogs/delete/${id}`).subscribe({
      next: () => this.blogs.update((list: Blog[]) => list.filter((b: Blog) => b.id !== id)),
    });
  }
}
