export interface Payment {
  id: string;
  customer?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userEmail?: string;
  order?: string;
  orderNumber?: string;
  orderId?: string;
  paymentNumber?: string;
  date?: string;
  createdAt?: string;
  paidAt?: string;
  method?: string;
  paymentMethod?: string;
  amount?: number;
  orderTotal?: number;
  referenceNumber?: string;
  status?: string;
  statusType?: string;
  [key: string]: any;
}
