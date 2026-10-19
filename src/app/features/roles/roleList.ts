import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RoleService } from 'src/app/core/services/roleService';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import {
  BaseListComponent,
  BaseListColumn,
  BaseListTab,
} from '@shared/components/base-list/base-list.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [RouterLink, NzTooltipModule, NzPopconfirmModule, LucideAngularModule, BaseListComponent],
  templateUrl: './roleList.html',
  styleUrl: './roleList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleListComponent {
  protected readonly totalCount = signal(0);
  protected readonly roles: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  protected readonly searchQuery = signal('');
  protected readonly activeTab = signal('all');
  protected readonly page = signal(1);
  protected pageSize = 10;

  protected readonly columns: BaseListColumn[] = [
    { key: 'role', label: 'Role' },
    { key: 'members', label: 'Members' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly activeCount: any;
  protected readonly inactiveCount: any;
  protected readonly totalMembers: any;
  protected readonly statusTabs: any;
  protected readonly filteredRoles: any;
  protected readonly pagedRoles: any;

  getTabCount(status: string): number {
    const all = this.roles() ?? [];
    if (status === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return all.filter((r: any) =>
      String(r.status).toLowerCase().replace(/ /g, '_') === String(status).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  getPermissionList(permissions: string | undefined | null): string[] {
    if (!permissions) return [];
    return permissions
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean);
  }

  protected onEdit(item: any): void {
    this.router.navigate(['/roles', item.id, 'edit']);
  }

  protected onDelete(item: any): void {
    this.roleService.delete(item.id);
    this.message.success(`Role "${item.name}" deleted`);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
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
    private readonly router: Router,
    private readonly message: NzMessageService,
    protected readonly roleService: RoleService,
  ) {
    this.roles = this.roleService.getAll();
    this.loading = this.roleService.loading;

    this.activeCount = computed(
      () => this.roles().filter((r: any) => r.status === 'System').length,
    );
    this.inactiveCount = computed(
      () => this.roles().filter((r: any) => r.status === 'Custom').length,
    );
    this.totalMembers = computed(() =>
      this.roles().reduce((sum: any, r: any) => sum + (r.members ?? 0), 0),
    );

    this.statusTabs = computed((): BaseListTab[] => [
      { label: 'All', value: 'all', count: this.getTabCount('all') },
      { label: 'System', value: 'System', count: this.getTabCount('System') },
      { label: 'Custom', value: 'Custom', count: this.getTabCount('Custom') },
    ]);

    this.filteredRoles = computed(() => {
      let list = this.roles();
      const query = this.searchQuery().toLowerCase().trim();
      const tab = this.activeTab();

      if (tab !== 'all') {
        list = list.filter((r: any) => r.status === tab);
      }

      if (query) {
        list = list.filter(
          (r: any) =>
            (r.name ?? '').toLowerCase().includes(query) ||
            (r.permissions ?? '').toLowerCase().includes(query) ||
            (r.description ?? '').toLowerCase().includes(query),
        );
      }

      return list;
    });

    this.pagedRoles = computed(() => {
      const all = this.filteredRoles();
      const start = (this.page() - 1) * this.pageSize;
      return all.slice(start, start + this.pageSize);
    });

    this.paginationMeta = computed(() => {
      const total = this.filteredRoles().length;
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
