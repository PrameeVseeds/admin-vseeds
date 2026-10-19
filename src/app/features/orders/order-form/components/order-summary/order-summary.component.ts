import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { LucideAngularModule } from 'lucide-angular';
import { formatDateTime } from 'src/app/shared/pipes/date-format.pipe';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, NzDividerModule, LucideAngularModule],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  @Input({ required: true }) orderNumber!: string;
  @Input({ required: true }) orderId!: string | null;
  @Input({ required: true }) orderDate!: string;
  @Input({ required: true }) lineItemsCount!: number;
  @Input({ required: true }) subtotal!: number;
  @Input({ required: true }) shipping!: number;
  @Input({ required: true }) total!: number;
  @Input() isLocked = false;
  @Input() sendingPayment = false;
  @Output() sendPayment = new EventEmitter<void>();

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
}
