import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NotificationService } from '@services/notificationService';
import { AuthService } from '@services/authService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgotPassword.html',
  styleUrl: './forgotPassword.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form: any;

  protected submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c: any) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.loading.set(true);

    this.authService.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
        this.notification.success('Password reset link has been sent to your email.');
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to send reset link. Please try again.');
      },
    });
  }

    constructor(private readonly fb: FormBuilder, private readonly notification: NotificationService, private readonly authService: AuthService) {
        this.form = this.fb.nonNullable.group({
            email: ['', [Validators.required, Validators.email]],
          });
    }
}
