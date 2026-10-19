export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  products?: number;
  description: string;
  status: string;
  statusType: string;
  subcategories?: any[];
  [key: string]: any;
}
