import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectService } from 'src/app/core/services/projectService';
import { PaginationMeta } from 'src/app/core/services/apiService';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

type ProjectItem = any;

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, BaseListComponent, NzModalModule, NzTooltipModule, LucideAngularModule],
  templateUrl: './projectList.html',
  styleUrl: './projectList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListComponent {
  protected readonly totalCount = signal(0);
  protected readonly projects: any;
  protected readonly loading: any;
  protected readonly searchQuery = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly currentPage = signal(1);
  pageSize = 10;

  protected readonly columns: BaseListColumn[] = [
    { key: 'project', label: 'Project' },
    { key: 'category', label: 'Category' },
    { key: 'technologies', label: 'Technologies' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getTabCount('all') },
    { label: 'Published', value: 'Published', count: this.getTabCount('Published') },
    { label: 'Draft', value: 'Draft', count: this.getTabCount('Draft') },
  ]);

  protected readonly publishedCount: any;
  protected readonly draftCount: any;
  protected readonly categoryCount: any;
  protected readonly filteredProjects: any;
  protected readonly paginatedProjects: any;
  protected readonly paginationMeta: any;

  getTabCount(tabValue: string): number {
    if (tabValue === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return this.projects().filter((p: any) =>
      String(p.status).toLowerCase().replace(/ /g, '_') === String(tabValue).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage.set(1);
  }

  protected onSearchChange(_value: string): void {
    this.currentPage.set(1);
  }

  protected onTabChange(_tab: string): void {
    this.currentPage.set(1);
  }

  protected onEdit(item: ProjectItem): void {
    this.router.navigate(['/projects', item.id, 'edit']);
  }

  protected onDelete(item: ProjectItem): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Project',
      description:
        'Are you sure you want to delete this project? This will remove it from the portfolio showcase.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.projectService.delete(item.id);
        this.message.success(`Project "${item.title}" deleted`);
      }
    });
  }

  exportProjects(): void {
    this.projectService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Title', 'Client', 'Category', 'Technologies', 'Status'];
    const rows = data.map((p: any) => [
      `"${p.title}"`,
      `"${p.client}"`,
      p.category,
      `"${p.technologies}"`,
      p.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Projects exported successfully');
    });
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly router: Router,
    private readonly projectService: ProjectService,
  ) {
    this.projects = this.projectService.getAll();
    this.loading = this.projectService.loading;
    this.publishedCount = computed(
      () => this.projects().filter((p: any) => p.status === 'Published').length,
    );
    this.draftCount = computed(
      () => this.projects().filter((p: any) => p.status === 'Draft').length,
    );
    this.categoryCount = computed(
      () => new Set(this.projects().map((p: any) => p.category)).size,
    );
    this.filteredProjects = computed(() => {
      const query = this.searchQuery().toLowerCase().trim();
      const tab = this.activeTab();

      let list = this.projects();

      if (tab !== 'all') {
        list = list.filter((p: any) => p.status === tab);
      }

      if (query) {
        list = list.filter((p: any) => {
          const techStr = Array.isArray(p.technologies)
            ? p.technologies.join(',')
            : p.technologies || '';

          return (
            (p.title || '').toLowerCase().includes(query) ||
            (p.category || '').toLowerCase().includes(query) ||
            (p.client || '').toLowerCase().includes(query) ||
            techStr.toLowerCase().includes(query)
          );
        });
      }

      return list;
    });
    this.paginatedProjects = computed(() => {
      const list = this.filteredProjects();
      const start = (this.currentPage() - 1) * this.pageSize;
      return list.slice(start, start + this.pageSize);
    });
    this.paginationMeta = computed((): PaginationMeta => {
      const total = this.filteredProjects().length;
      return {
        total,
        page: this.currentPage(),
        totalPages: Math.ceil(total / this.pageSize) || 1,
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
