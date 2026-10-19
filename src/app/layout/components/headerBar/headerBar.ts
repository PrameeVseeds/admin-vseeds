import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  viewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ThemeService } from '@services/themeService';
import { AuthService } from '@services/authService';
import { TokenStorageService } from '@services/tokenStorageService';
import { ActivityLogService } from '@services/activityLogService';
import { CommandPaletteComponent } from '../commandPalette/commandPalette';
import { CommonModule } from '@angular/common';

interface HeaderNotification {
  id: number;
  uid: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  type: 'order' | 'quote';
  source: string;
  status: string;
  read: boolean;
  routerLink: string;
}

const READ_NOTIF_KEY = 'admin_read_notifications';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  standard_pcb: 'Standard PCB',
  advanced_pcb: 'Advanced PCB',
  fpc_rigid_flex: 'FPC / Rigid-Flex',
  pcb_assembly: 'PCB Assembly',
  smd_stencil: 'SMD Stencil',
};

@Component({
  selector: 'app-header-bar',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    NzDropDownModule,
    NzBadgeModule,
    NzAvatarModule,
    NzTooltipModule,
    NzTagModule,
    CommandPaletteComponent,
    CommonModule,
  ],
  templateUrl: './headerBar.html',
  styleUrl: './headerBar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderBarComponent implements OnInit, OnDestroy {
  readonly collapsed = input(false);
  readonly toggleSidebar = output<void>();
  protected readonly commandPalette = viewChild<CommandPaletteComponent>('commandPalette');

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly readIds = signal<Set<string>>(this.loadReadIds());

  protected readonly notifications: any;

  protected readonly unreadCount: any;

  ngOnInit(): void {
    this.authService.fetchProfile().subscribe();
    this.activityLogService.loadNotifications();
    this.pollTimer = setInterval(() => this.activityLogService.loadNotifications(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  protected openSearch(): void {
    this.commandPalette()?.show();
  }

  protected markAsRead(notification: HeaderNotification): void {
    this.readIds.update((ids) => {
      const next = new Set(ids);
      next.add(notification.uid);
      this.saveReadIds(next);
      return next;
    });
  }

  protected markAllRead(): void {
    this.readIds.update((ids) => {
      const next = new Set(ids);
      this.notifications().forEach((n: any) => next.add(n.uid));
      this.saveReadIds(next);
      return next;
    });
  }

  protected logout(): void {
    this.authService.logout();
  }

  private mapToNotification(item: any, readSet: Set<string>): HeaderNotification {
    const uid = `${item.type}-${item.id}`;

    if (item.type === 'order') {
      return {
        id: item.id,
        uid,
        title: `Order ${item.orderNumber}`,
        description: `${item.customerName} — ₹${Number(item.totalAmount).toLocaleString()}`,
        time: this.timeAgo(new Date(item.createdAt)),
        icon: 'shopping-cart',
        type: 'order',
        source: 'Electronics Store',
        status: item.status,
        read: readSet.has(uid),
        routerLink: '/orders',
      };
    }

    const svc = SERVICE_TYPE_LABELS[item.serviceType] || item.serviceType || '';
    return {
      id: item.id,
      uid,
      title: `Quote ${item.quoteNumber}`,
      description: `${item.customerName} — ${svc}`,
      time: this.timeAgo(new Date(item.createdAt)),
      icon: 'file-text',
      type: 'quote',
      source: 'Embedded Store',
      status: item.status,
      read: readSet.has(uid),
      routerLink: '/quotes',
    };
  }

  private timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private loadReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem(READ_NOTIF_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveReadIds(ids: Set<string>): void {
    localStorage.setItem(READ_NOTIF_KEY, JSON.stringify([...ids]));
  }

  constructor(
    protected readonly themeService: ThemeService,
    private readonly authService: AuthService,
    protected readonly tokenStorage: TokenStorageService,
    private readonly activityLogService: ActivityLogService,
  ) {
    this.notifications = computed<HeaderNotification[]>(() => {
      const items = this.activityLogService.headerNotifications();
      const readSet = this.readIds();
      return items.map((item: any) => this.mapToNotification(item, readSet));
    });
    this.unreadCount = computed(() => this.notifications().filter((n: any) => !n.read).length);
  }
}
