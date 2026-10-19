import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  viewChild,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

interface CommandItem {
  label: string;
  icon: string;
  route: string;
  group: string;
  keywords: string[];
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './commandPalette.html',
  styleUrl: './commandPalette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  private readonly commands: CommandItem[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard', group: 'Navigation', keywords: ['home', 'main', 'overview'] },
    { label: 'Products', icon: 'package', route: '/products', group: 'E-Commerce', keywords: ['items', 'inventory', 'goods'] },
    { label: 'Categories', icon: 'layers', route: '/categories', group: 'E-Commerce', keywords: ['groups', 'types'] },
    { label: 'Orders', icon: 'shopping-cart', route: '/orders', group: 'E-Commerce', keywords: ['purchases', 'sales'] },
    { label: 'Payments', icon: 'credit-card', route: '/payments', group: 'E-Commerce', keywords: ['transactions', 'billing', 'money'] },
    { label: 'Deliveries', icon: 'truck', route: '/deliveries', group: 'E-Commerce', keywords: ['shipping', 'tracking', 'dispatch'] },
    { label: 'Wishlists', icon: 'heart', route: '/wishlists', group: 'E-Commerce', keywords: ['favorites', 'saved'] },
    { label: 'Banners', icon: 'image', route: '/banners', group: 'Content', keywords: ['hero', 'slider', 'ads'] },
    { label: 'Blogs', icon: 'file-text', route: '/blogs', group: 'Content', keywords: ['articles', 'posts', 'news'] },
    { label: 'FAQs', icon: 'help-circle', route: '/faqs', group: 'Content', keywords: ['questions', 'help', 'support'] },
    { label: 'Projects', icon: 'folder-kanban', route: '/projects', group: 'Content', keywords: ['portfolio', 'showcase'] },
    { label: 'Reviews', icon: 'star', route: '/reviews', group: 'Content', keywords: ['ratings', 'feedback', 'testimonials'] },
    { label: 'Quotes', icon: 'file-text', route: '/quotes', group: 'PCB Services', keywords: ['estimates', 'pricing', 'inquiry'] },
    { label: 'Customers', icon: 'users', route: '/users', group: 'Users', keywords: ['clients', 'buyers', 'accounts'] },
    { label: 'Admins', icon: 'user-cog', route: '/admins', group: 'Users', keywords: ['staff', 'team', 'managers'] },
    { label: 'Roles', icon: 'shield', route: '/roles', group: 'Users', keywords: ['permissions', 'access', 'privileges'] },
    { label: 'Statistics', icon: 'bar-chart-3', route: '/statistics', group: 'Analytics', keywords: ['reports', 'data', 'charts', 'analytics'] },
    { label: 'Activity Logs', icon: 'activity', route: '/activity-logs', group: 'Analytics', keywords: ['audit', 'history', 'actions'] },
    { label: 'Contact Messages', icon: 'message-square', route: '/contacts', group: 'Communication', keywords: ['inbox', 'enquiries', 'messages'] },
    { label: 'Email Templates', icon: 'mail', route: '/email-templates', group: 'Communication', keywords: ['emails', 'notifications', 'templates'] },
    { label: 'Image Gallery', icon: 'image', route: '/images', group: 'Media', keywords: ['photos', 'uploads', 'files', 'gallery'] },
    { label: 'Settings', icon: 'settings', route: '/settings', group: 'System', keywords: ['config', 'preferences', 'system'] },
    { label: 'Profile', icon: 'user', route: '/profile', group: 'System', keywords: ['account', 'my profile', 'personal'] },
  ];

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.commands;
    return this.commands.filter((cmd: any) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q) ||
        cmd.keywords.some((k: any) => k.includes(q)),
    );
  });

  protected readonly groupedResults = computed(() => {
    const items = this.filtered();
    const map = new Map<string, CommandItem[]>();
    for (const item of items) {
      const group = map.get(item.group) ?? [];
      group.push(item);
      map.set(item.group, group);
    }
    return Array.from(map.entries()).map(([group, cmds]) => ({ group, items: cmds }));
  });

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (!this.open()) return;

    if (event.key === 'Escape') {
      this.close();
      return;
    }

    const total = this.filtered().length;
    if (!total) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i: any) => (i + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i: any) => (i - 1 + total) % total);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const items = this.filtered();
      const selected = items[this.activeIndex()];
      if (selected) this.navigate(selected);
    }
  }

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.show();
    }
  }

  show(): void {
    this.query.set('');
    this.activeIndex.set(0);
    this.open.set(true);
    setTimeout(() => this.searchInput()?.nativeElement.focus(), 50);
  }

  close(): void {
    this.open.set(false);
  }

  protected navigate(item: CommandItem): void {
    this.close();
    this.router.navigate([item.route]);
  }

  protected onSearch(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cmd-palette__overlay')) {
      this.close();
    }
  }

  protected flatIndex(groupIdx: number, itemIdx: number): number {
    const groups = this.groupedResults();
    let idx = 0;
    for (let g = 0; g < groupIdx; g++) {
      idx += groups[g].items.length;
    }
    return idx + itemIdx;
  }

    constructor(private readonly router: Router) {
    }
}
