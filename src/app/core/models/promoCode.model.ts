export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableSite: 'electronics' | 'embedded' | 'both';
  minimumOrderAmount: number;
  maximumDiscountAmount: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startDate: string | null;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}
