import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BlogService } from 'src/app/core/services/blogService';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
  BaseListTab,
} from '@shared/components/base-list/base-list.component';

type BlogItem = any;

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [FormsModule, NzModalModule, NzTooltipModule, LucideAngularModule, BaseListComponent],
  templateUrl: './blogList.html',
  styleUrl: './blogList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListComponent {
  protected readonly totalCount = signal(0);
  protected readonly blogs: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly page = signal(1);
  pageSize = 10;

  protected readonly statusTabs = computed<BaseListTab[]>(() => [
    { label: 'All', value: 'all', count: this.getTabCount('all') },
    { label: 'Published', value: 'Published', count: this.getTabCount('Published') },
    { label: 'Draft', value: 'Draft', count: this.getTabCount('Draft') },
    { label: 'Archived', value: 'Archived', count: this.getTabCount('Archived') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'article', label: 'Article' },
    { key: 'published', label: 'Published' },
    { key: 'updated', label: 'Last Updated' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly publishedCount: any;

  protected readonly draftCount: any;

  protected readonly avgReadTime: any;

  protected readonly filteredBlogs: any;

  protected readonly pagedBlogs: any;

  getTabCount(status: string): number {
    const all = this.blogs() ?? [];
    if (status === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return all.filter((b: any) =>
      String(b.status).toLowerCase().replace(/ /g, '_') === String(status).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  createPost(): void {
    this.router.navigate(['/blogs/create']);
  }

  protected onEdit(item: BlogItem): void {
    this.router.navigate(['/blogs', item.id, 'edit']);
  }

  protected onDelete(item: BlogItem): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Article',
      description:
        'Are you sure you want to delete this blog post? This action will remove it from the website catalog immediately.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.blogService.delete(item.id);
        this.message.success(`Post "${item.title}" deleted`);
      }
    });
  }

  togglePublish(item: BlogItem): void {
    const isPublishing = item.status !== 'Published';
    const modal = openConfirm(this.modalService, {
      title: isPublishing ? 'Publish Post' : 'Unpublish Post',
      description: isPublishing
        ? `Publish "${item.title}"? It will be visible to all readers on the website.`
        : `Unpublish "${item.title}"? It will be moved back to draft and hidden from readers.`,
      confirmText: isPublishing ? 'Publish' : 'Unpublish',
      cancelText: 'Cancel',
      iconName: isPublishing ? 'check-circle' : 'eye-off',
    }, { width: '420px' });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        const today = new Date().toISOString();
        this.blogService
          .update(item.id, {
            ...item,
            status: isPublishing ? 'published' : 'draft',
            publishedAt: isPublishing ? today : null,
          })
          .subscribe({
            next: () => {
              this.message.success(
                `Post "${item.title}" ${isPublishing ? 'published' : 'unpublished'}`,
              );
            },
            error: () => {
              this.message.error(`Failed to ${isPublishing ? 'publish' : 'unpublish'} post`);
            },
          });
      }
    });
  }

  exportBlogs(): void {
    this.blogService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Title', 'Author', 'Published', 'Status'];
    const rows = data.map((b: any) => [`"${b.title}"`, b.author, b.published, b.status]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blogs-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Blog posts exported successfully');
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.activeTab.set('all');
    this.page.set(1);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.page.set(1);
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page.set(1);
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly router: Router,
    protected readonly blogService: BlogService,
  ) {
    this.blogs = this.blogService.getAll();
    this.loading = this.blogService.loading;
    this.publishedCount = computed(
      () => this.blogs().filter((b: any) => b.status === 'Published').length,
    );
    this.draftCount = computed(() => this.blogs().filter((b: any) => b.status === 'Draft').length);
    this.avgReadTime = computed(() => {
      const list = this.blogs();
      if (list.length === 0) return 0;
      const total = list.reduce((sum: any, b: any) => {
        const time = parseInt(b.readTime) || 0;
        return sum + time;
      }, 0);
      return Math.round(total / list.length);
    });
    this.filteredBlogs = computed(() => {
      const term = this.searchTerm().toLowerCase().trim();
      const tab = this.activeTab();

      let list = this.blogs();

      if (tab !== 'all') {
        list = list.filter((b: any) => b.status === tab);
      }

      if (term) {
        list = list.filter(
          (b: any) =>
            b.title.toLowerCase().includes(term) ||
            b.author.toLowerCase().includes(term) ||
            b.status.toLowerCase().includes(term),
        );
      }

      return list;
    });

    this.pagedBlogs = computed(() => {
      const all = this.filteredBlogs();
      const start = (this.page() - 1) * this.pageSize;
      return all.slice(start, start + this.pageSize);
    });

    this.paginationMeta = computed(() => {
      const total = this.filteredBlogs().length;
      return {
        total,
        totalPages: Math.max(1, Math.ceil(total / this.pageSize)),
        page: this.page(),
      };
    });

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
