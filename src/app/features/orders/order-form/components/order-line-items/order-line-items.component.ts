import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { ProductService } from 'src/app/core/services/product.service';
import { NzMessageService } from 'ng-zorro-antd/message';

type Product = {
  id: string;
  name: string;
  sku?: string;
  price1: number;
  price10?: number;
  price100?: number;
  [key: string]: any;
};

@Component({
  selector: 'app-order-line-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTooltipModule,
    LucideAngularModule,
  ],
  templateUrl: './order-line-items.component.html',
  styleUrls: ['./order-line-items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderLineItemsComponent {
  @Input({ required: true }) lineItems!: FormArray;
  @Input({ required: true }) products: any[] = [];
  @Input() locked = false;
  @Output() recalc = new EventEmitter<void>();

  readonly showAddRow = signal(false);
  readonly selectedProductId = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly productService: ProductService,
    private readonly message: NzMessageService,
  ) {}

  createLineItemGroup(item?: {
    productId?: string;
    product: string;
    storeId: string;
    qty: number;
    unitPrice: number;
  }): FormGroup {
    return this.fb.nonNullable.group({
      productId: [item?.productId ?? ''],
      product: [item?.product ?? '', [Validators.required]],
      storeId: [item?.storeId ?? ''],
      qty: [item?.qty ?? 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  getLineTotal(index: number): number {
    const group = this.lineItems.at(index);
    const qty = group.get('qty')?.value ?? 0;
    const unitPrice = group.get('unitPrice')?.value ?? 0;
    return qty * unitPrice;
  }

  formatCurrency(value: number): string {
    return (
      'Rs. ' +
      (+value || 0).toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  toggleAddRow(): void {
    if (this.locked) return;
    this.showAddRow.update((v) => !v);
    this.selectedProductId.set(null);
  }

  confirmAddItem(): void {
    const productId = this.selectedProductId();
    if (!productId) {
      this.message.warning('Please select a product');
      return;
    }

    const product = this.productService.getById(productId);
    if (!product) return;

    this.lineItems.push(
      this.createLineItemGroup({
        productId: product.id,
        product: product.name,
        storeId: product.sku ?? '',
        qty: 1,
        unitPrice: this.resolveUnitPrice(product, 1),
      }),
    );

    this.showAddRow.set(false);
    this.selectedProductId.set(null);
    this.recalc.emit();
    this.message.success(`${product.name} added`);
  }

  cancelAddItem(): void {
    this.showAddRow.set(false);
    this.selectedProductId.set(null);
  }

  onQtyChange(index: number): void {
    const group = this.lineItems.at(index);
    const productId = group.get('productId')?.value;
    const qty = group.get('qty')?.value ?? 1;

    if (productId) {
      const product = this.productService.getById(productId);
      if (product) {
        const unitPrice = this.resolveUnitPrice(product, qty);
        group.get('unitPrice')?.setValue(unitPrice, { emitEvent: false });
      }
    }
    this.recalc.emit();
  }

  private resolveUnitPrice(product: Product, qty: number): number {
    if (qty >= 100 && product.price100) return product.price100;
    if (qty >= 10 && product.price10) return product.price10;
    return product.price1 || 0;
  }

  removeItem(index: number): void {
    this.lineItems.removeAt(index);
    this.recalc.emit();
  }
}
