import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EmailTemplateService } from 'src/app/core/services/emailTemplateService';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  category: string;
  status: string;
  body: string;
  description?: string;
  variables?: string[];
};

@Component({
  selector: 'app-email-template-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzTooltipModule,
    LucideAngularModule,
  ],
  templateUrl: './emailTemplateList.html',
  styleUrl: './emailTemplateList.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateListComponent {
  protected readonly templates: any;
  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal('all');

  previewVisible = false;
  previewTitle = '';
  previewHtml: SafeHtml = '';

  private readonly categoryMap: Record<string, string> = {
    Orders: 'orders',
    Account: 'account',
    Communication: 'communication',
    Inventory: 'inventory',
    Admin: 'admin',
    Wishlist: 'wishlist',
    Promotions: 'promotions',
  };

  private readonly iconMap: Record<string, string> = {
    Orders: 'shopping-cart',
    Account: 'user',
    Communication: 'message-square',
    Inventory: 'package',
    Admin: 'user-cog',
    Wishlist: 'heart',
    Promotions: 'tag',
  };

  readonly categoryTabs = [
    { label: 'All', value: 'all' },
    { label: 'Orders', value: 'Orders' },
    { label: 'Account', value: 'Account' },
    { label: 'Admin', value: 'Admin' },
    { label: 'Communication', value: 'Communication' },
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Wishlist', value: 'Wishlist' },
    { label: 'Promotions', value: 'Promotions' },
  ];

  protected readonly activeCount: any;

  protected readonly inactiveCount: any;

  protected readonly categoryCount: any;

  protected readonly filteredTemplates: any;

  getTabCount(value: string): number {
    if (value === 'all') return this.templates().length;
    return this.templates().filter((t: any) => t.category === value).length;
  }

  getCategoryClass(category: string): string {
    return this.categoryMap[category] ?? 'default';
  }

  getCategoryIcon(category: string): string {
    return this.iconMap[category] ?? 'mail';
  }

  editTemplate(tpl: EmailTemplate): void {
    this.router.navigate(['/email-templates', tpl.id, 'edit']);
  }

  previewTemplate(tpl: EmailTemplate): void {
    this.previewTitle = tpl.name;
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(tpl.body);
    this.previewVisible = true;
  }

  toggleStatus(tpl: EmailTemplate): void {
    const newStatus = tpl.status === 'Active' ? 'Inactive' : 'Active';
    this.emailTemplateService.update(tpl.id, { ...tpl, status: newStatus }).subscribe({
      next: () => this.message.success(`"${tpl.name}" is now ${newStatus}`),
      error: () => this.message.error('Failed to update status'),
    });
  }

    constructor(private readonly router: Router, private readonly sanitizer: DomSanitizer, private readonly message: NzMessageService, private readonly emailTemplateService: EmailTemplateService) {
        this.templates = this.emailTemplateService.getAll();
        this.activeCount = computed(
            () => this.templates().filter((t: any) => t.status === 'Active').length,
          );
        this.inactiveCount = computed(
            () => this.templates().filter((t: any) => t.status === 'Inactive').length,
          );
        this.categoryCount = computed(
            () => new Set(this.templates().map((t: any) => t.category)).size,
          );
        this.filteredTemplates = computed(() => {
            const term = this.searchTerm().toLowerCase().trim();
            const tab = this.activeTab();

            let list = this.templates();

            if (tab !== 'all') {
              list = list.filter((t: any) => t.category === tab);
            }

            if (term) {
              list = list.filter((t: any) =>
                  t.name.toLowerCase().includes(term) ||
                  t.subject.toLowerCase().includes(term) ||
                  t.category.toLowerCase().includes(term),
              );
            }

            return list;
          });
    }
}
