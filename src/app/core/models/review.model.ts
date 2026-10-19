export interface Review {
  id: string;
  customer?: string;
  name?: string;
  product?: string;
  productName?: string;
  comment?: string;
  reviewText?: string;
  date?: string;
  createdAt?: string;
  isApproved?: boolean | null;
  status?: string;
  statusType?: string;
  [key: string]: any;
}
