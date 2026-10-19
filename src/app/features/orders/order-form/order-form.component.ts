import { Component, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { OrderService } from 'src/app/core/services/orderService';
import { ProductService } from 'src/app/core/services/product.service';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';
import { OrderLineItemsComponent } from './components/order-line-items/order-line-items.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';

type OrderItem = {
  id: string;
  email?: string;
  shippingFee?: number;
  lineItems?: Array<{ product: string; storeId: string; qty: number; unitPrice: number }>;
  [key: string]: any;
};
type Product = {
  id: string;
  name: string;
  category?: string;
  sku?: string;
  price1: number;
  price10?: number;
  price100?: number;
  status?: string;
  [key: string]: any;
};

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDividerModule,
    NzInputNumberModule,
    NzTooltipModule,
    LucideAngularModule,
    OrderLineItemsComponent,
    OrderSummaryComponent,
  ],
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderFormComponent {
  readonly orderId: string | null;
  order: OrderItem | undefined;
  orderNumber = '';

  readonly products: Product[];

  readonly form: any;

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  readonly recalcTrigger = signal(0);
  readonly isModified = signal(false);
  readonly loading = signal(true);
  readonly orderStatus = signal('');

  get isLocked(): boolean {
    const s = this.orderStatus().toLowerCase();
    return s === 'cancelled' || s === 'refunded' || s === 'delivered';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
  ) {
    this.orderId = this.route.snapshot.paramMap.get('id');
    this.products = this.productService
      .getAll()()
      .filter((p: any) => p.status !== 'Out of Stock');
    this.form = this.fb.nonNullable.group({
      shippingFee: [0, [Validators.required, Validators.min(0)]],
      lineItems: this.fb.array([] as FormGroup[]),
    });
    effect(() => {
      this.recalcTrigger();
    });

    if (this.orderId) {
      this.orderService.loadById(this.orderId).subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          if (data) {
            this.order = data;
            this.orderNumber = data.orderNumber || this.orderId || '';
            this.orderStatus.set(data.status || '');
            this.form.patchValue({ shippingFee: +(data.shippingFee ?? 0) });
            const rawItems = data.lineItems || data.items || [];
            rawItems.forEach((item: any) => {
              this.lineItems.push(
                this.fb.nonNullable.group({
                  productId: [item.productId || item.product?.id || ''],
                  product: [item.productName || item.product?.name || '', [Validators.required]],
                  storeId: [item.storeId || item.product?.sku || ''],
                  qty: [item.qty || item.quantity || 1, [Validators.required, Validators.min(1)]],
                  unitPrice: [item.unitPrice ? +item.unitPrice : 0, [Validators.required, Validators.min(0)]],
                }),
              );
            });
          }
          this.loading.set(false);
        },
        error: () => {
          this.message.error('Failed to load order');
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  get subtotal(): number {
    let total = 0;
    for (let i = 0; i < this.lineItems.length; i++) {
      const group = this.lineItems.at(i);
      const qty = group.get('qty')?.value ?? 0;
      const unitPrice = group.get('unitPrice')?.value ?? 0;
      total += qty * unitPrice;
    }
    return total;
  }

  get shippingFeeValue(): number {
    return +(this.form.get('shippingFee')?.value ?? 0);
  }

  get orderTotal(): number {
    return this.subtotal + this.shippingFeeValue;
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

  formatDate(value: string): string {
    return formatDateTime(value);
  }

  triggerRecalc(): void {
    this.recalcTrigger.update((v: any) => v + 1);
    this.isModified.set(true);
  }

  readonly sendingPayment = signal(false);

  sendPaymentRequest(): void {
    if (this.isLocked) {
      this.message.warning('This order is locked and cannot be modified');
      return;
    }
    if (!this.orderId || this.sendingPayment()) return;
    if (!this.form.valid) {
      this.message.warning('Please fix form errors before sending');
      return;
    }

    this.sendingPayment.set(true);
    const loadingRef = this.message.loading('Saving & sending payment request...');

    const val = this.form.getRawValue();
    const payload = { shippingFee: val.shippingFee, lineItems: val.lineItems };

    this.orderService.updateOrder(this.orderId, payload).subscribe({
      next: () => {
        this.isModified.set(false);
        this.orderService.sendPaymentRequest(this.orderId!).subscribe({
          next: (res: any) => {
            this.message.remove(loadingRef.messageId);
            const data = res?.data ?? res;
            if (data?.success === false) {
              this.message.error(data.message || 'Failed to send payment request');
            } else {
              this.message.success(data?.message || `Payment request sent to ${this.order?.email ?? 'customer'}`);
            }
            this.sendingPayment.set(false);
          },
          error: (err: any) => {
            this.message.remove(loadingRef.messageId);
            this.message.error(err?.error?.message || 'Failed to send payment request');
            this.sendingPayment.set(false);
          },
        });
      },
      error: (err: any) => {
        this.message.remove(loadingRef.messageId);
        this.message.error(err?.error?.message || 'Failed to save order before sending');
        this.sendingPayment.set(false);
      },
    });
  }

  submit(): void {
    if (this.isLocked) {
      this.message.warning('This order is locked and cannot be modified');
      return;
    }
    if (this.form.valid && this.orderId) {
      const val = this.form.getRawValue();
      const payload = {
        shippingFee: val.shippingFee,
        lineItems: val.lineItems,
      };

      this.orderService.updateOrder(this.orderId, payload).subscribe({
        next: () => {
          this.message.success('Order updated successfully');
          this.router.navigate(['/orders']);
        },
        error: (err: any) => {
          this.message.error(err?.error?.message || 'Failed to update order');
        },
      });
    } else {
      Object.values(this.form.controls).forEach((control: any) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.lineItems.controls.forEach((group: any) => {
        Object.values((group as FormGroup).controls).forEach((c: any) => {
          if (c.invalid) {
            c.markAsDirty();
            c.updateValueAndValidity({ onlySelf: true });
          }
        });
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
