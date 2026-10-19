export interface Quote {
  id: string;
  customer?: string;
  customerName?: string;
  email?: string;
  customerEmail?: string;
  phone?: string;
  customerPhone?: string;
  company?: string;
  customerCompany?: string;
  quoteId?: string;
  quoteNumber?: string;
  date?: string;
  createdAt?: string;
  service?: string;
  serviceType?: string;
  layers?: any;
  quantity?: any;
  estimatedCost?: string;
  totalPrice?: number;
  status?: string;
  statusType?: string;
  details?: any;
  [key: string]: any;
}
