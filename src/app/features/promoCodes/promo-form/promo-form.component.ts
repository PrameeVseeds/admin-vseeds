import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PromoCodeService } from 'src/app/core/services/promoCodeService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';
import { MyValidators } from 'src/app/shared/validators/custom-validator';

@Component({
  selector: 'app-promo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzSwitchModule,
    NzDividerModule,
    LucideAngularModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './promo-form.component.html',
  styleUrls: ['./promo-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoFormComponent {
  readonly promoId: string | null;
  readonly isEditMode: boolean;
  readonly loading = signal(false);

  readonly siteOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'embedded', label: 'Embedded / PCB' },
    { value: 'both', label: 'Both Sites' },
  ];

  readonly form: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly message: NzMessageService,
    private readonly promoService: PromoCodeService,
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), MyValidators.spaceValidator(), MyValidators.letterNumberValidator()]],
      description: [''],
      discountType: ['percentage' as string, [Validators.required]],
      discountValue: [0 as number, [Validators.required, Validators.min(0.01)]],
      applicableSite: ['both' as string, [Validators.required]],
      minimumOrderAmount: [0 as number],
      maximumDiscountAmount: [null as number | null],
      usageLimit: [0 as number],
      perUserLimit: [1 as number],
      startDate: [null as Date | null],
      expiryDate: [null as Date | null],
      isActive: [true],
    });

    this.promoId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.promoId;

    if (this.isEditMode) {
      this.loading.set(true);
      this.promoService.getById(this.promoId!).subscribe({
        next: (promo) => {
          this.form.patchValue({
            code: promo.code,
            description: promo.description || '',
            discountType: promo.discountType,
            discountValue: +promo.discountValue,
            applicableSite: promo.applicableSite,
            minimumOrderAmount: +promo.minimumOrderAmount || 0,
            maximumDiscountAmount: promo.maximumDiscountAmount ? +promo.maximumDiscountAmount : null,
            usageLimit: promo.usageLimit || 0,
            perUserLimit: promo.perUserLimit || 1,
            startDate: promo.startDate ? new Date(promo.startDate) : null,
            expiryDate: promo.expiryDate ? new Date(promo.expiryDate) : null,
            isActive: promo.isActive,
          });
          this.loading.set(false);
        },
        error: () => {
          this.message.error('Failed to load promo code');
          this.loading.set(false);
        },
      });
    }
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    this.form.patchValue({ code: input.value });
  }

  submit() {
    if (this.form.valid) {
      this.loading.set(true);
      const val = this.form.getRawValue();
      const payload: any = {
        code: val.code,
        description: val.description || undefined,
        discountType: val.discountType,
        discountValue: val.discountValue,
        applicableSite: val.applicableSite,
        minimumOrderAmount: val.minimumOrderAmount || 0,
        maximumDiscountAmount: val.maximumDiscountAmount || undefined,
        usageLimit: val.usageLimit || 0,
        perUserLimit: val.perUserLimit || 1,
        startDate: val.startDate ? val.startDate.toISOString() : undefined,
        expiryDate: val.expiryDate ? val.expiryDate.toISOString() : undefined,
        isActive: val.isActive,
      };

      const obs$ = this.isEditMode
        ? this.promoService.update(this.promoId!, payload)
        : this.promoService.create(payload);

      obs$.subscribe({
        next: () => {
          this.message.success(
            this.isEditMode ? 'Promo code updated' : 'Promo code created',
          );
          this.router.navigate(['/promo-codes']);
        },
        error: (err: any) => {
          const errMsg = Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message || 'Failed to save promo code';
          this.message.error(errMsg);
          this.loading.set(false);
        },
      });
    } else {
      Object.values(this.form.controls).forEach((control: any) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/promo-codes']);
  }
}
