export interface Order {
  id: string;
  customer?: string;
  email?: string;
  userEmail?: string;
  date?: string;
  createdAt?: string;
  items?: number;
  amount?: number;
  totalAmount?: number;
  order?: string;
  orderNumber?: string;
  status?: string;
  statusType?: string;
  [key: string]: any;
}
