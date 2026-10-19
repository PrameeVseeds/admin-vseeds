import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { ContactDetailModalComponent } from 'src/app/shared/components/contact-detail-modal/contact-detail-modal.component';
import { ContactService } from 'src/app/core/services/contactService';
import { openModal, openConfirm } from 'src/app/shared/utils/modal-helpers';
import {
  BaseListComponent,
  BaseListColumn,
} from '@shared/components/base-list/base-list.component';

type ContactItem = any;

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [BaseListComponent, NzTooltipModule, NzModalModule, LucideAngularModule],
  templateUrl: './contactList.html',
  styleUrl: './contactList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactListComponent {
  protected readonly totalCount = signal(0);
  protected readonly contacts: any;
  protected readonly paginationMeta: any;
  protected readonly loading: any;
  pageSize = 20;

  protected readonly statusTabs = computed(() => [
    { label: 'All', value: 'all', count: this.getStatusCount('all') },
    { label: 'New', value: 'new', count: this.getStatusCount('new') },
    { label: 'Read', value: 'read', count: this.getStatusCount('read') },
    { label: 'Replied', value: 'replied', count: this.getStatusCount('replied') },
    { label: 'Archived', value: 'archived', count: this.getStatusCount('archived') },
  ]);

  protected readonly columns: BaseListColumn[] = [
    { key: 'sender', label: 'Sender' },
    { key: 'subject', label: 'Subject' },
    { key: 'received', label: 'Received' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly newCount: any;
  protected readonly pendingCount: any;
  protected readonly repliedCount: any;
  protected readonly filteredContacts: any;

  getStatusCount(status: string): number {
    if (status === 'all') return this.totalCount() > 0 ? this.totalCount() : this.paginationMeta().total;
    return this.contacts().filter((c: any) =>
      String(c.status).toLowerCase().replace(/ /g, '_') === String(status).toLowerCase().replace(/ /g, '_')
    ).length;
  }

  onSearchChange(_value: string): void {
    this.contactService.loadAll({ page: 1, limit: this.pageSize });
  }

  protected readonly activeTab = signal('all');

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onPageChange(page: number): void {
    this.contactService.loadAll({ page, limit: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.contactService.loadAll({ page: 1, limit: size });
  }

  viewContact(contact: ContactItem): void {
    const modal = openModal(this.modalService, {
      content: ContactDetailModalComponent,
      data: contact,
      className: 'contact-detail-modal',
    });

    modal.afterClose.subscribe((result: any) => {
      if (!result) return;

      if (result.action === 'read') {
        this.contactService.updateStatus(result.id, 'read').subscribe({
          next: () => {
            this.contactService.loadAll();
            this.message.success('Message marked as read');
          },
          error: () => this.message.error('Failed to update status'),
        });
      }

      if (result.action === 'archive') {
        this.contactService.updateStatus(result.id, 'archived').subscribe({
          next: () => {
            this.contactService.loadAll();
            this.message.success('Message archived');
          },
          error: () => this.message.error('Failed to archive message'),
        });
      }

      if (result.action === 'reply' && result.message) {
        this.contactService.reply(result.id, result.message).subscribe({
          next: () => {
            this.contactService.loadAll();
            this.message.success(`Reply sent to ${contact.name}`);
          },
          error: () => this.message.error('Failed to send reply'),
        });
      }

      if (result.action === 'resolve') {
        this.contactService.reply(result.id, result.message || 'Resolved').subscribe({
          next: () => {
            this.contactService.loadAll();
            this.message.success(`Message marked as resolved`);
          },
          error: () => this.message.error('Failed to resolve message'),
        });
      }
    });
  }

  onDelete(item: ContactItem): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Message',
      description: `Are you sure you want to delete the message from "${item.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.contactService.delete(item.id).subscribe({
          next: () => {
            this.contactService.loadAll();
            this.message.success('Message deleted');
          },
          error: () => this.message.error('Failed to delete message'),
        });
      }
    });
  }

  exportContacts(): void {
    this.contactService.getAllForExport().subscribe((data: any[]) => {
    const headers = ['Name', 'Email', 'Phone', 'Subject', 'Date', 'Status'];
    const rows = data.map((c: any) => [
      `"${c.name}"`,
      c.email,
      c.phone,
      `"${c.subject}"`,
      c.date,
      c.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Contacts exported successfully');
    });
  }

  constructor(
    private readonly modalService: NzModalService,
    private readonly message: NzMessageService,
    private readonly contactService: ContactService,
  ) {
    this.contacts = this.contactService.getAll();
    this.paginationMeta = this.contactService.paginationMeta;
    this.loading = this.contactService.loading;
    this.newCount = computed(() => this.getStatusCount('new'));
    this.pendingCount = computed(() => this.getStatusCount('read'));
    this.repliedCount = computed(() => this.getStatusCount('replied'));

    this.filteredContacts = computed(() => {
      const tab = this.activeTab();
      if (tab === 'all') return this.contacts();
      return this.contacts().filter((c: any) =>
        String(c.status).toLowerCase().replace(/ /g, '_') === tab,
      );
    });

    effect(() => {
      const total = this.paginationMeta().total;
      if (total > 0 && this.totalCount() === 0) {
        this.totalCount.set(total);
      }
    });
  }
}
