import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { AdminService } from 'src/app/core/services/adminService';
import { RoleService } from 'src/app/core/services/roleService';
import { Router, RouterLink } from '@angular/router';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { PaginationMeta } from 'src/app/core/services/apiService';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [RouterLink, BaseListComponent, NzModalModule, NzTooltipModule, LucideAngularModule],
  templateUrl: './adminList.html',
  styleUrl: './adminList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminListComponent {
  protected readonly totalCount = signal(0);
  protected readonly admins: any;
  protected readonly roles: any;
  protected readonly loading: any;
  protected readonly searchQuery = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly currentPage = signal(1);
  pageSize = 10;

  protected readonly columns: BaseListColumn[] = [
    { key: 'admin', label: 'Admin' },
    { key: 'role', label: 'Role' },
    { key: 'lastActive', label: 'Last Active' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly roleTabs: any;

  private safeList() {
    return (this.admins() ?? []).filter((a: any): a is NonNullable<typeof a> => a != null);
  }

  protected readonly activeCount = computed(
    () => this.safeList().filter((a: any) => a.status === 'Active').length,
  );

  protected readonly inactiveCount = computed(
    () => this.safeList().filter((a: any) => a.status !== 'Active').length,
  );

  protected readonly superAdminCount = computed(
    () => this.safeList().filter((a: any) => a.role === 'Super Admin').length,
  );

  protected readonly filteredAdmins = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const tab = this.activeTab();

    return this.safeList().filter((admin: any) => {
      const matchesSearch =
        !query ||
        (admin.name ?? '').toLowerCase().includes(query) ||
        (admin.email ?? '').toLowerCase().includes(query) ||
        (admin.role ?? '').toLowerCase().includes(query);

      const matchesTab = tab === 'all' || admin.role === tab;

      return matchesSearch && matchesTab;
    });
  });

  protected readonly paginatedAdmins = computed(() => {
    const list = this.filteredAdmins();
    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  protected readonly paginationMeta = computed((): PaginationMeta => {
    const total = this.filteredAdmins().length;
    return {
      total,
      page: this.currentPage(),
      totalPages: Math.ceil(total / this.pageSize) || 1,
    };
  });

  protected getRoleCount(role: string): number {
    return this.safeList().filter((a: any) => a.role === role).length;
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage.set(1);
  }

  protected onEdit(item: any): void {
    this.router.navigate(['/admins', item.id, 'edit']);
  }

  protected onDelete(item: any): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Admin',
      description:
        'Are you sure you want to remove this admin account? They will lose all access to the portal.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.adminService.delete(item.id).subscribe({
          next: () => {
            this.adminService.loadAll();
            this.message.success(`Admin "${item.name}" deleted`);
          },
          error: () => this.message.error('Failed to delete admin'),
        });
      }
    });
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly router: Router,
    private readonly adminService: AdminService,
    private readonly roleService: RoleService,
    private readonly message: NzMessageService,
  ) {
    this.admins = this.adminService.getAll();
    this.roles = this.roleService.getAll();
    this.loading = this.adminService.loading;
    this.roleTabs = computed(() => {
      const roles = this.roles();
      const allCount = this.safeList().length;
      const tabs = [{ label: 'All', value: 'all', count: allCount }];
      for (const r of roles) {
        const name = r.name
          ?.split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        if (name) tabs.push({ label: name, value: name, count: this.getRoleCount(name) });
      }
      return tabs;
    });

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
