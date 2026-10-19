import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NotificationService } from '@services/notificationService';
import { AuthService } from '@services/authService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './resetPassword.html',
  styleUrl: './resetPassword.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);

  private resetToken = '';

  constructor(private readonly fb: FormBuilder, private readonly notification: NotificationService, private readonly authService: AuthService, private readonly route: ActivatedRoute) {
      this.form = this.fb.nonNullable.group(
          {
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]],
          },
          { validators: [this.passwordMatchValidator] },
        );
    this.route.queryParams.subscribe((params: any) => {
      this.resetToken = params['token'] || '';
    });
  }

  protected hasUppercase(): boolean {
    return /[A-Z]/.test(this.form.get('password')?.value ?? '');
  }

  protected hasNumber(): boolean {
    return /[0-9]/.test(this.form.get('password')?.value ?? '');
  }

  protected readonly form: any;

  protected togglePassword(): void {
    this.showPassword.update((v: any) => !v);
  }

  protected toggleConfirm(): void {
    this.showConfirm.update((v: any) => !v);
  }

  protected submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c: any) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.loading.set(true);

    this.authService.resetPassword(this.resetToken, this.form.value.password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
        this.notification.success('Password has been reset successfully.');
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to reset password. The link may have expired.');
      },
    });
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }
}
