import { Component, ChangeDetectionStrategy, signal, computed, effect, OnInit } from '@angular/core';
import { UserService } from 'src/app/core/services/userService';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { UserDetailModalComponent } from 'src/app/shared/components/user-detail-modal/user-detail-modal.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

type UserItem = any;

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NzModalModule, NzTooltipModule, LucideAngularModule, BaseListComponent],
  templateUrl: './userList.html',
  styleUrl: './userList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit {
  protected readonly totalCount = signal(0);
  protected readonly statusCounts = signal({
    total: 0,
    active: 0,
    inactive: 0,
  });
  protected readonly users: any;
  protected readonly paginationMeta: any;
  protected readonly searchQuery = signal('');
  protected readonly activeTab = signal('all');
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getTabCount('all') },
    { label: 'Active', value: 'Active', count: this.getTabCount('Active') },
    { label: 'Inactive', value: 'Inactive', count: this.getTabCount('Inactive') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'customer', label: 'Customer' },
    { key: 'contact', label: 'Contact' },
    { key: 'activity', label: 'Activity' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly loading: any;
  protected readonly activeCount: any;
  protected readonly totalOrders: any;
  protected readonly totalRevenue: any;
  protected readonly filteredUsers: any;

  getTabCount(status: string): number {
    const counts = this.statusCounts();
    const key = status.toLowerCase().replace(/ /g, '_');
    if (key === 'all') return counts.total || this.paginationMeta().total;
    return (counts as any)[key] ?? 0;
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.userService.loadAll({ page: 1, limit: this.pageSize });
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.userService.loadAll({ page: 1, limit: this.pageSize });
  }

  onPageChange(page: number): void {
    this.userService.loadAll({ page, limit: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.userService.loadAll({ page: 1, limit: size });
  }

  ngOnInit(): void {
    this.userService.loadAll({ page: 1, limit: this.pageSize });
  }

  viewUser(user: UserItem): void {
    const modal = openModal(this.modalService, {
      content: UserDetailModalComponent,
      data: user,
      className: 'user-detail-modal',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result?.action === 'toggleStatus') {
        this.updateStatus(result.id, result.status, result.type);
      }
    });
  }

  exportUsers(): void {
    this.userService.getAllForExport().subscribe((data: any[]) => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Joined',
      'Orders',
      'Total Spent',
      'Status',
    ];
    const rows = data.map((u: any) => [
      `"${u.name}"`,
      u.email,
      u.phone,
      `"${u.company}"`,
      u.joined,
      u.orders,
      `"${u.totalSpent}"`,
      u.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Customers exported successfully');
    });
  }

  private updateStatus(id: string, status: string, type: string): void {
    const originalList = this.users();

    // Optimistic UI update
    this.users.update((list: any) =>
      list.map((u: any) => (u.id === id ? { ...u, status, statusType: type } : u)),
    );

    this.userService.updateStatus(id, status).subscribe({
      next: () => {
        this.message.success(`User account successfully ${status.toLowerCase()}`);
      },
      error: () => {
        // Rollback on failure
        this.users.set(originalList);
        this.message.error(`Failed to ${status.toLowerCase()} user account`);
      },
    });
  }

  constructor(
    private readonly userService: UserService,
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
  ) {
    this.users = this.userService.getAll();
    this.paginationMeta = this.userService.paginationMeta;
    this.loading = this.userService.loading;
    this.activeCount = computed(() => this.statusCounts().active);
    this.totalOrders = computed(() =>
      this.users().reduce((sum: any, u: any) => sum + (u.orders ?? 0), 0),
    );
    this.totalRevenue = computed(() => {
      const total = this.users().reduce((sum: any, u: any) => {
        return sum + (u.totalSpentRaw ?? 0);
      }, 0);
      return `Rs. ${total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
    });
    this.filteredUsers = computed(() => {
      let list = this.users();
      const tab = this.activeTab();
      const query = this.searchQuery().toLowerCase().trim();

      if (tab !== 'all') {
        list = list.filter((u: any) => u.status === tab);
      }

      if (query) {
        list = list.filter(
          (u: any) =>
            (u.name ?? '').toLowerCase().includes(query) ||
            (u.email ?? '').toLowerCase().includes(query) ||
            (u.company && u.company.toLowerCase().includes(query)),
        );
      }

      return list;
    });

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });

    this.loadStatusCounts();
  }

  private loadStatusCounts(): void {
    this.userService.getCounts().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.statusCounts.set({
          total: data.total ?? 0,
          active: data.active ?? 0,
          inactive: data.inactive ?? 0,
        });
        this.totalCount.set(data.total ?? 0);
      },
      error: () => this.message.error('Failed to load customer counts'),
    });
  }
}
