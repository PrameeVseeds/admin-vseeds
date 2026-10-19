import { Injectable, signal } from '@angular/core';
import { ApiService } from './apiService';
import { HttpClient } from '@angular/common/http';
import { DashboardStat, RecentOrder } from '@models/dashboard.model';
import { forkJoin } from 'rxjs';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiService {
  readonly stats = signal<DashboardStat[]>([]);
  readonly recentOrders = signal<RecentOrder[]>([]);

  constructor(http: HttpClient) {
    super(http);
  }

  loadStats() {
    this._loading.set(true);
    this._error.set(null);
    forkJoin({
      detailed: this.get<any>('statistics/detailed'),
      orders: this.get<any>('orders/all?page=1&limit=5'),
    }).subscribe({
      next: ({ detailed, orders }) => {
        const d = detailed.data || detailed || {};
        this.stats.set(this.buildStatCards(d));

        const rawOrders = this.extractArray(orders.data);
        this.recentOrders.set(rawOrders.map((o: any) => this.mapRecentOrder(o)));
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this._error.set(err?.error?.message || 'Failed to load dashboard');
        this.stats.set([]);
        this.recentOrders.set([]);
      },
    });
  }

  private buildStatCards(d: any): DashboardStat[] {
    const fmt = (n: any) => {
      const num = Number(n) || 0;
      return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
    };
    const fmtCurrency = (n: any) => {
      const num = Number(n) || 0;
      return `Rs. ${num.toLocaleString('en-LK', { minimumFractionDigits: 0 })}`;
    };

    return [
      {
        title: 'Total Revenue',
        value: fmtCurrency(d.totalRevenue),
        icon: 'wallet',
        color: '#10b981',
        trend: `${d.newUsersThisMonth || 0} new users`,
        trendUp: true,
      },
      {
        title: 'Total Orders',
        value: fmt(d.totalOrders),
        icon: 'shopping-cart',
        color: '#3b82f6',
        trend: `${d.pendingOrders || 0} pending`,
        trendUp: (d.pendingOrders || 0) > 0,
      },
      {
        title: 'Products',
        value: fmt(d.activeProducts ?? d.products),
        icon: 'package',
        color: '#f59e0b',
        trend: `${d.products || 0} total`,
        trendUp: true,
      },
      {
        title: 'Customers',
        value: fmt(d.totalUsers),
        icon: 'users',
        color: '#8b5cf6',
        trend: `${d.newUsersThisMonth || 0} this month`,
        trendUp: (d.newUsersThisMonth || 0) > 0,
      },
    ];
  }

  private mapRecentOrder(o: any): RecentOrder {
    const status = (o.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const statusTypeMap: Record<string, string> = {
      Delivered: 'success', Processing: 'processing', Shipped: 'processing',
      Pending: 'warning', 'Waiting For Payment': 'warning',
      Cancelled: 'error', Refunded: 'error',
    };
    return {
      id: o.orderNumber || o.id,
      customer: o.email || o.userEmail || '—',
      amount: `Rs. ${(Number(o.totalAmount) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`,
      date: formatDateTime(o.createdAt),
      status,
      statusType: statusTypeMap[status] || 'info',
    };
  }
}
