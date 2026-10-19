export interface Wishlist {
  productId: string;
  product: string;
  sku?: string;
  count: number;
  stock: string;
  stockType: string;
  [key: string]: any;
}
