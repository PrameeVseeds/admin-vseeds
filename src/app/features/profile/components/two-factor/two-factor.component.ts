import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '@services/authService';
import { MyValidators } from 'src/app/shared/validators/custom-validator';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzInputModule,
    NzTooltipModule,
    LucideAngularModule,
  ],
  templateUrl: './two-factor.component.html',
  styleUrl: './two-factor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorComponent implements OnChanges {
  @Input() enabled: boolean = false;

  is2faEnabled = signal(false);
  show2faSetup = false;
  showDisable2fa = false;
  tfaLoading = signal(false);
  tfaQrCode = signal<string | null>(null);
  tfaSecret = signal<string | null>(null);

  protected readonly otpForm: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly message: NzMessageService,
    private readonly authService: AuthService,
  ) {
    this.otpForm = this.fb.nonNullable.group({
      otp: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          MyValidators.numberValidator(),
        ],
      ],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enabled']) {
      this.is2faEnabled.set(this.enabled);
    }
  }

  toggle2fa(): void {
    if (this.is2faEnabled()) {
      this.showDisable2fa = true;
    } else {
      this.start2faSetup();
    }
  }

  private start2faSetup(): void {
    this.tfaLoading.set(true);
    this.authService.setup2fa().subscribe({
      next: (res) => {
        this.tfaLoading.set(false);
        this.tfaQrCode.set(res.data?.qrCode || null);
        this.tfaSecret.set(res.data?.secret || null);
        this.show2faSetup = true;
      },
      error: (err) => {
        this.tfaLoading.set(false);
        const msg = err.error?.data?.message || err.error?.message || 'Failed to set up 2FA';
        this.message.error(msg);
      },
    });
  }

  onVerify2fa(): void {
    if (this.otpForm.valid) {
      this.tfaLoading.set(true);
      this.authService.verify2fa(this.otpForm.getRawValue().otp).subscribe({
        next: () => {
          this.tfaLoading.set(false);
          this.is2faEnabled.set(true);
          this.show2faSetup = false;
          this.otpForm.reset();
          this.tfaQrCode.set(null);
          this.tfaSecret.set(null);
          this.message.success('Two-factor authentication enabled successfully');
        },
        error: (err) => {
          this.tfaLoading.set(false);
          const msg = err.error?.data?.message || err.error?.message || 'Invalid verification code';
          this.message.error(msg);
        },
      });
    }
  }

  onDisable2fa(): void {
    if (this.otpForm.valid) {
      this.tfaLoading.set(true);
      this.authService.disable2fa(this.otpForm.getRawValue().otp).subscribe({
        next: () => {
          this.tfaLoading.set(false);
          this.is2faEnabled.set(false);
          this.showDisable2fa = false;
          this.otpForm.reset();
          this.message.success('Two-factor authentication disabled');
        },
        error: (err) => {
          this.tfaLoading.set(false);
          const msg = err.error?.data?.message || err.error?.message || 'Invalid verification code';
          this.message.error(msg);
        },
      });
    }
  }
}
