import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LucideAngularModule } from 'lucide-angular';
import { ActivityLogService } from 'src/app/core/services/activityLogService';
import { CommonModule } from '@angular/common';
import { ActivityLogDetailModalComponent } from './activity-log-detail-modal/activity-log-detail-modal.component';
import { DateTimePipe } from 'src/app/shared/pipes/date-format.pipe';
import { openModal } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
  BaseListTab,
} from '@shared/components/base-list/base-list.component';

@Component({
  selector: 'app-activity-log-list',
  standalone: true,
  imports: [NzModalModule, LucideAngularModule, CommonModule, DateTimePipe, BaseListComponent],
  templateUrl: './activityLogList.html',
  styleUrl: './activityLogList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogListComponent {
  protected readonly totalCount = signal(0);
  protected readonly logs: any;
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal('all');
  protected readonly page = signal(1);
  protected pageSize = 15;

  readonly actionTabs: BaseListTab[] = [
    { label: 'All', value: 'all' },
    { label: 'Login', value: 'Login' },
    { label: 'Created', value: 'Created' },
    { label: 'Updated', value: 'Updated' },
    { label: 'Deleted', value: 'Deleted' },
  ];

  protected readonly columns: BaseListColumn[] = [
    { key: 'actor', label: 'Actor' },
    { key: 'event', label: 'Event' },
    { key: 'resource', label: 'Resource' },
    { key: 'description', label: 'Description' },
    { key: 'timestamp', label: 'Timestamp' },
  ];

  protected readonly createdCount: any;
  protected readonly updatedCount: any;
  protected readonly deletedCount: any;

  protected readonly statusTabs: any;
  protected readonly filteredLogs: any;
  protected readonly pagedLogs: any;
  protected readonly paginationMeta: any;

  getTabCount(action: string): number {
    const all = this.logs() ?? [];
    if (action === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return all.filter((l: any) =>
      String(l?.action).toLowerCase().replace(/ /g, '_') === String(action).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  onView(item: any): void {
    openModal(this.modal, {
      content: ActivityLogDetailModalComponent,
      data: item,
      width: '640px',
      title: 'Activity Log Details',
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
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

  exportLogs(): void {
    this.activityLogService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Name', 'Email', 'Role', 'Action', 'Resource', 'Description', 'Date', 'IP'];
    const rows = data.map((l: any) => [
      `"${l?.userName ?? '-'}"`,
      `"${l?.userEmail ?? '-'}"`,
      `"${l?.userRole ?? '-'}"`,
      l?.action ?? '-',
      `"${l?.resourceLabel ?? '-'}"`,
      `"${(l?.description ?? '-').replace(/"/g, '""')}"`,
      l?.date ?? '-',
      l?.ip ?? '-',
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Activity logs exported successfully');
    });
  }

  constructor(
    private readonly message: NzMessageService,
    private readonly modal: NzModalService,
    protected readonly activityLogService: ActivityLogService,
  ) {
    this.logs = this.activityLogService.getAll();
    this.createdCount = computed(
      () => (this.logs() ?? []).filter((l: any) => l?.action === 'Created').length,
    );
    this.updatedCount = computed(
      () => (this.logs() ?? []).filter((l: any) => l?.action === 'Updated').length,
    );
    this.deletedCount = computed(
      () => (this.logs() ?? []).filter((l: any) => l?.action === 'Deleted').length,
    );

    this.statusTabs = computed(() =>
      this.actionTabs.map((t) => ({ ...t, count: this.getTabCount(t.value) })),
    );

    this.filteredLogs = computed(() => {
      let list = (this.logs() ?? []).filter((l: any): l is NonNullable<typeof l> => l != null);
      const tab = this.activeTab();
      const query = this.searchTerm().toLowerCase().trim();

      if (tab !== 'all') {
        list = list.filter((l: any) => l.action === tab);
      }

      if (query) {
        list = list.filter(
          (l: any) =>
            (l.userName || '').toLowerCase().includes(query) ||
            (l.userEmail || '').toLowerCase().includes(query) ||
            (l.userRole || '').toLowerCase().includes(query) ||
            (l.action || '').toLowerCase().includes(query) ||
            (l.resourceLabel || '').toLowerCase().includes(query) ||
            (l.entityDisplayName || '').toLowerCase().includes(query) ||
            (l.entityId || '').toLowerCase().includes(query) ||
            (l.description || '').toLowerCase().includes(query) ||
            (l.ip || '').includes(query),
        );
      }

      return list;
    });

    this.pagedLogs = computed(() => {
      const all = this.filteredLogs();
      const start = (this.page() - 1) * this.pageSize;
      return all.slice(start, start + this.pageSize);
    });

    this.paginationMeta = computed(() => {
      const total = this.filteredLogs().length;
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
