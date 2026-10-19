export interface User {
  id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  joined?: string;
  createdAt?: string;
  orders?: number;
  orderCount?: number;
  totalSpent?: string;
  totalSpentRaw?: number;
  company?: string;
  status: string;
  statusType?: string;
  [key: string]: any;
}
