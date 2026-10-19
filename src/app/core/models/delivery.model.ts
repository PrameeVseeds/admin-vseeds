export interface Delivery {
  id: string;
  tracking?: string;
  order?: string;
  orderNumber?: string;
  orderId?: string;
  customer?: string;
  firstName?: string;
  lastName?: string;
  userEmail?: string;
  carrier?: string;
  shipped?: string;
  shippedAt?: string;
  expected?: string;
  expectedDeliveryAt?: string;
  status?: string;
  statusType?: string;
  deliveredAt?: string;
  orderStatus?: string;
  [key: string]: any;
}
