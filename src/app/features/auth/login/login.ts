import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { AuthService } from '@services/authService';
import { NotificationService } from '@services/notificationService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    FloatLabelComponent,
    FormErrorComponent,
    NzGridModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  protected readonly step = signal<'credentials' | '2fa'>('credentials');
  private tempToken = '';

  protected togglePassword(): void {
    this.showPassword.update((v: any) => !v);
  }

  protected readonly form: any;

  protected readonly otpForm: any;

  protected submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c: any) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data.requires2fa) {
          this.tempToken = res.data.tempToken!;
          this.step.set('2fa');
          this.notification.info('Please enter your 2FA verification code');
        } else {
          this.notification.success('Logged in successfully');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.notifyError(
          'Login failed',
          err.error?.message ?? 'Invalid credentials. Please try again.',
        );
      },
    });
  }

  protected submitOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.controls.code.markAsDirty();
      this.otpForm.controls.code.updateValueAndValidity();
      return;
    }

    this.loading.set(true);
    const { code } = this.otpForm.getRawValue();

    this.authService.verifyLoginOtp(this.tempToken, code).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success('Logged in successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.notifyError(
          'Verification failed',
          err.error?.message ?? 'Invalid verification code',
        );
        this.otpForm.reset();
      },
    });
  }

  protected backToCredentials(): void {
    this.step.set('credentials');
    this.tempToken = '';
    this.otpForm.reset();
  }

    constructor(private readonly fb: FormBuilder, private readonly authService: AuthService, private readonly notification: NotificationService, private readonly router: Router) {
        this.form = this.fb.nonNullable.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            remember: [false],
          });
        this.otpForm = this.fb.nonNullable.group({
            code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
          });
    }
}
