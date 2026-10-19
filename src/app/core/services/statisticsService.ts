import { Injectable } from '@angular/core';
import { ApiService } from './apiService';
import { HttpClient } from '@angular/common/http';

export interface DetailedStats {
  categories?: number;
  products?: number;
  activeProducts?: number;
  lowStock?: number;
  outOfStock?: number;
  totalOrders?: number;
  pendingOrders?: number;
  processingOrders?: number;
  deliveredOrders?: number;
  totalUsers?: number;
  newUsersThisMonth?: number;
  totalQuotes?: number;
  pendingQuotes?: number;
  totalRevenue?: number;
}

export interface TrendsData {
  period?: string;
  days?: number;
  newProducts?: number;
  newCategories?: number;
  newOrders?: number;
  newUsers?: number;
}

export interface ActivityLogItem {
  id?: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  description?: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class StatisticsService extends ApiService {
  getDetailed() {
    return this.get<DetailedStats>('statistics/detailed');
  }

  getTrends(period: string = '30d') {
    return this.get<TrendsData>(`statistics/trends?period=${period}`);
  }

  getRecentActivity(days: number = 7, limit: number = 10) {
    return this.get<ActivityLogItem[]>(`activity-logs/recent?days=${days}&limit=${limit}`);
  }

  constructor(http: HttpClient) {
    super(http);
  }
}
