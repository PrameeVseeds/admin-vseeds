import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { StatisticsService } from 'src/app/core/services/statisticsService';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

type KpiStat = {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  iconBg: string;
  iconColor: string;
};

type MonthlyRevenueItem = { month: string; revenue: number; profit: number };

type OrderSegment = {
  label: string;
  count: number;
  color: string;
  pct: number;
  dash: string;
  offset: number;
};

type TopProduct = { name: string; category: string; revenue: string; units: number };

type ActivityItem = {
  icon: string;
  text: string;
  time: string;
  iconBg: string;
  iconColor: string;
};

const ICON_MAP: Record<string, string> = {
  order: 'shopping-cart',
  orders: 'shopping-cart',
  user: 'user',
  users: 'users',
  product: 'package',
  products: 'package',
  category: 'folder',
  categories: 'folder',
  quote: 'file-text',
  quote_request: 'file-text',
  login: 'log-in',
  default: 'activity',
};

const COLOR_MAP: Record<string, { bg: string; color: string }> = {
  order: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  user: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  product: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  default: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
};

function formatRevenue(n: number): string {
  if (n >= 1_000_000) return 'Rs. ' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return 'Rs. ' + (n / 1_000).toFixed(0) + 'K';
  return 'Rs. ' + (n ?? 0).toLocaleString('en-LK');
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return Math.floor(sec / 60) + ' min ago';
  if (sec < 86400) return Math.floor(sec / 3600) + ' hours ago';
  if (sec < 604800) return Math.floor(sec / 86400) + ' days ago';
  return formatDateTime(d);
}

@Component({
  selector: 'app-statistics-dashboard',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './statisticsDashboard.html',
  styleUrl: './statisticsDashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsDashboardComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly stats = signal<KpiStat[]>([]);
  protected readonly monthlyRevenue = signal<MonthlyRevenueItem[]>([]);
  protected readonly totalOrders = signal(0);
  protected readonly orderSegments = signal<OrderSegment[]>([]);
  protected readonly topProducts = signal<TopProduct[]>([]);
  protected readonly recentActivity = signal<ActivityItem[]>([]);

  protected readonly maxRevenue = computed(() => {
    const rev = this.monthlyRevenue();
    if (!rev.length) return 1;
    return Math.max(...rev.map((m: any) => m.revenue), 1);
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.statisticsService.getDetailed().subscribe({
      next: (res) => {
        const d = res.data;
        if (d) {
          this.stats.set(this.mapStats(d));
          this.totalOrders.set(d.totalOrders ?? 0);
          this.orderSegments.set(this.buildOrderSegments(d));
        }
        this.monthlyRevenue.set([]);
        this.topProducts.set([]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load statistics');
        this.loading.set(false);
      },
    });

    this.statisticsService.getRecentActivity(7, 10).subscribe({
      next: (res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        this.recentActivity.set(list.map((log: any) => this.mapActivityItem(log)));
      },
    });
  }

  private mapStats(d: any): KpiStat[] {
    const revenue = formatRevenue(Number(d.totalRevenue ?? 0));
    const orders = (d.totalOrders ?? 0).toLocaleString('en-LK');
    const users = (d.totalUsers ?? 0).toLocaleString('en-LK');

    return [
      {
        label: 'Total Revenue',
        value: revenue,
        trend: '—',
        trendUp: true,
        icon: 'wallet',
        iconBg: 'rgba(16,185,129,0.1)',
        iconColor: '#10b981',
      },
      {
        label: 'Total Orders',
        value: orders,
        trend: '—',
        trendUp: true,
        icon: 'shopping-cart',
        iconBg: 'rgba(59,130,246,0.1)',
        iconColor: '#3b82f6',
      },
      {
        label: 'Active Customers',
        value: users,
        trend: '—',
        trendUp: true,
        icon: 'users',
        iconBg: 'rgba(168,85,247,0.1)',
        iconColor: '#a855f7',
      },
      {
        label: 'Conversion Rate',
        value: '—',
        trend: '—',
        trendUp: true,
        icon: 'activity',
        iconBg: 'rgba(245,158,11,0.1)',
        iconColor: '#f59e0b',
      },
    ];
  }

  private buildOrderSegments(d: any): OrderSegment[] {
    const total = Number(d.totalOrders ?? 0);
    const delivered = Number(d.deliveredOrders ?? 0);
    const processing = Number(d.processingOrders ?? 0);
    const pending = Number(d.pendingOrders ?? 0);
    const cancelled = Math.max(0, total - delivered - processing - pending);

    const raw = [
      { label: 'Delivered', count: delivered, color: '#10b981' },
      { label: 'Processing', count: processing, color: '#3b82f6' },
      { label: 'Pending', count: pending, color: '#f59e0b' },
      { label: 'Cancelled', count: cancelled, color: '#ef4444' },
    ].filter((s: any) => s.count > 0);

    if (total === 0) return [];

    const circumference = 2 * Math.PI * 48;
    const gap = 4;
    let accumulated = 0;

    return raw.map((s: any) => {
      const pct = Math.round((s.count / total) * 100);
      const segLen = (s.count / total) * circumference - gap;
      const offset = -accumulated + circumference * 0.25;
      accumulated += (s.count / total) * circumference;
      return {
        ...s,
        pct,
        dash: `${Math.max(segLen, 2)} ${circumference}`,
        offset,
      };
    });
  }

  private mapActivityItem(log: any): ActivityItem {
    const entity = (log.entity_type || 'default').toLowerCase();
    const icon = ICON_MAP[entity] ?? ICON_MAP[log.action?.toLowerCase()] ?? ICON_MAP['default'];
    const colors = COLOR_MAP[entity] ?? COLOR_MAP[log.action?.toLowerCase()] ?? COLOR_MAP['default'];
    const text = log.description || `${log.action} — ${log.entity_type}`;
    const time = log.created_at ? timeAgo(log.created_at) : '—';

    return {
      icon,
      text,
      time,
      iconBg: colors.bg,
      iconColor: colors.color,
    };
  }

  refresh(): void {
    this.load();
  }

    constructor(private readonly statisticsService: StatisticsService) {
    }
}
