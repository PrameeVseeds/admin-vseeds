import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '@services/authService';
import { FloatLabelComponent } from '@shared/components/float-label/float-label.component';

@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzInputModule,
    LucideAngularModule,
    FloatLabelComponent,
  ],
  templateUrl: './password-form.component.html',
  styleUrl: './password-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFormComponent {
  passwordLoading = signal(false);
  showPasswordForm = false;
  showCurrentPw = false;
  showNewPw = false;
  showConfirmPw = false;

  protected readonly passwordForm: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly message: NzMessageService,
    private readonly authService: AuthService,
  ) {
    this.passwordForm = this.fb.nonNullable.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: [this.passwordMatchValidator.bind(this)] },
    );
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.passwordLoading.set(true);
      const { currentPassword, newPassword } = this.passwordForm.getRawValue();
      this.authService.changePassword({ currentPassword, newPassword }).subscribe({
        next: () => {
          this.passwordLoading.set(false);
          this.message.success('Password updated successfully');
          this.passwordForm.reset();
          this.showPasswordForm = false;
          this.showCurrentPw = false;
          this.showNewPw = false;
          this.showConfirmPw = false;
        },
        error: (err) => {
          this.passwordLoading.set(false);
          const msg = err.error?.data?.message || err.error?.message || 'Failed to update password';
          this.message.error(msg);
        },
      });
    }
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPw = control.get('newPassword')?.value;
    const confirmPw = control.get('confirmPassword')?.value;

    if (confirmPw && newPw !== confirmPw) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }
}
