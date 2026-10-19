import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { OrderService } from 'src/app/core/services/orderService';
import { FloatLabelComponent } from '@shared/components/float-label/float-label.component';
import { formatDateOnly } from 'src/app/shared/pipes/date-format.pipe';

@Component({
  selector: 'app-add-delivery-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    FloatLabelComponent,
  ],
  templateUrl: './add-delivery-modal.component.html',
  styleUrl: './add-delivery-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDeliveryModalComponent {
  readonly orderOptions: any;

  readonly carrierOptions = [
    'DHL Express',
    'FedEx',
    'UPS',
    'Sri Lanka Post (EMS)',
    'Aramex',
    'TNT Express',
  ];

  readonly customerName = signal('');

  readonly form: any;

  onOrderChange(orderId: string): void {
    const selected = this.orderOptions.find((o: any) => o.id === orderId);
    this.customerName.set(selected ? selected.customer : '');
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.modalRef.close({
      order: v.order,
      customer: this.customerName(),
      tracking: v.tracking!.trim(),
      carrier: v.carrier,
      shipped: formatDateOnly(v.shipped!),
      estimated: formatDateOnly(v.estimated!),
    });
  }

  onCancel(): void {
    this.modalRef.close(null);
  }

    constructor(private readonly modalRef: NzModalRef, private readonly orderService: OrderService, private readonly fb: FormBuilder) {
        this.orderOptions = this.orderService.getAll()()
          .filter((o: any) => ['Processing', 'Shipped'].includes(o.status));
        this.form = this.fb.group({
            order: ['', Validators.required],
            tracking: ['', [Validators.required, Validators.minLength(1)]],
            carrier: ['', Validators.required],
            shipped: [null as Date | null, Validators.required],
            estimated: [null as Date | null, Validators.required],
          });
    }
}
