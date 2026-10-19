import { Injectable, signal } from '@angular/core';
import { ApiService } from './apiService';
import { HttpClient } from '@angular/common/http';
import { Wishlist } from '@models/wishlist.model';

@Injectable({ providedIn: 'root' })
export class WishlistService extends ApiService {
  readonly wishlists = signal<Wishlist[]>([]);

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
    }
    return this.wishlists;
  }

  loadAll() {
    this._loading.set(true);
    this._error.set(null);
    this.get<any>('wishlist/all?limit=100&page=1').subscribe({
      next: (res) => {
        const raw = this.extractArray(res.data);
        this.wishlists.set(raw.map((row) => this.normalizeWishlistAggRow(row)));
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this._error.set(err?.error?.message || 'Failed to load wishlists');
        this.wishlists.set([]);
      },
    });
  }

  /**
   * Admin aggregate API returns camelCase or lowercase raw aliases; map to fields the UI expects.
   */
  private normalizeWishlistAggRow(raw: Record<string, unknown>): Wishlist {
    const str = (v: unknown) => (v == null || v === '' ? '' : String(v)).trim();
    const productName = str(
      raw['productName'] ??
        raw['productname'] ??
        raw['product_name'] ??
        raw['product'],
    );
    const productId = str(
      raw['productId'] ?? raw['productid'] ?? raw['product_id'],
    );
    const count =
      Number(raw['wishlistCount'] ?? raw['wishlistcount'] ?? raw['count'] ?? 0) ||
      0;
    const sku = str(raw['sku'] ?? raw['SKU']);
    const qtyRaw =
      raw['quantityInHand'] ?? raw['quantity_in_hand'] ?? raw['quantityinhand'];
    const qty =
      qtyRaw === null || qtyRaw === undefined || qtyRaw === ''
        ? null
        : Number(qtyRaw);
    let stock = 'Stock unknown';
    let stockType = 'info';
    if (qty !== null && !Number.isNaN(qty)) {
      stock = qty > 0 ? 'In Stock' : 'Out of Stock';
      stockType = qty > 0 ? 'success' : 'error';
    }
    return {
      productId,
      product: productName || 'Unknown product',
      sku: sku || undefined,
      count,
      stock,
      stockType,
    };
  }
}
