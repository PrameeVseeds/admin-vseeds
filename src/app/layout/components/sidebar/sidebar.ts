import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '@services/themeService';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: { label: string; route: string }[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NzLayoutModule,
    NzMenuModule,
    NzTooltipModule,
    LucideAngularModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly collapsed = input(false);
  readonly collapsedChange = output<boolean>();
  readonly isDark: any;
  readonly menuTheme: any;

  protected readonly menuGroups: MenuGroup[] = [
    {
      title: '',
      items: [{ label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard' }],
    },
    {
      title: 'E-Commerce',
      items: [
        { label: 'Products', icon: 'package', route: '/products' },
        { label: 'Categories', icon: 'layers', route: '/categories' },
        { label: 'Orders', icon: 'shopping-cart', route: '/orders' },
        { label: 'Invoices', icon: 'file-text', route: '/invoices' },
        { label: 'Payments', icon: 'credit-card', route: '/payments' },
        { label: 'Deliveries', icon: 'truck', route: '/deliveries' },
        { label: 'Promo Codes', icon: 'ticket', route: '/promo-codes' },
        { label: 'Wishlists', icon: 'heart', route: '/wishlists' },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Banners', icon: 'image', route: '/banners' },
        { label: 'Blogs', icon: 'file-text', route: '/blogs' },
        { label: 'FAQs', icon: 'help-circle', route: '/faqs' },
        { label: 'Projects', icon: 'folder-kanban', route: '/projects' },
        { label: 'Reviews', icon: 'star', route: '/reviews' },
      ],
    },
    {
      title: 'PCB Services',
      items: [{ label: 'Quotes', icon: 'file-text', route: '/quotes' }],
    },
    {
      title: 'Users',
      items: [
        { label: 'Customers', icon: 'users', route: '/users' },
        { label: 'Admins', icon: 'user-cog', route: '/admins' },
        { label: 'Roles', icon: 'shield', route: '/roles' },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Statistics', icon: 'bar-chart-3', route: '/statistics' },
        { label: 'Activity Logs', icon: 'activity', route: '/activity-logs' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { label: 'Contact Messages', icon: 'message-square', route: '/contacts' },
        { label: 'Email Templates', icon: 'mail', route: '/email-templates' },
      ],
    },
    {
      title: 'Media',
      items: [{ label: 'Image Gallery', icon: 'image', route: '/images' }],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', icon: 'settings', route: '/settings' },
        { label: 'Bank Details', icon: 'landmark', route: '/settings/banks' },
      ],
    },
  ];

    constructor(private readonly themeService: ThemeService) {
        this.isDark = computed(() => this.themeService.theme() === 'dark');
        this.menuTheme = computed(() => (this.isDark() ? 'dark' : 'light'));
    }
}
