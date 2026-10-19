export interface DashboardStat {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend: string;
  trendUp: boolean;
  [key: string]: any;
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: string;
  date: string;
  status: string;
  statusType: string;
  [key: string]: any;
}
