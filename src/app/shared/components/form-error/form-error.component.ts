import {
  Component,
  ChangeDetectionStrategy,
  Input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';

type ErrorMapper = (label: string, error: any) => string;

const ERROR_MESSAGES: Record<string, ErrorMapper> = {
  required: (label) => `${label} is required`,
  email: () => `Please enter a valid email address`,
  minlength: (label, err) =>
    `${label} must be at least ${err.requiredLength} characters`,
  maxlength: (label, err) =>
    `${label} must be at most ${err.requiredLength} characters`,
  min: (label, err) => `${label} must be at least ${err.min}`,
  max: (label, err) => `${label} must be at most ${err.max}`,
  pattern: (label) => `${label} format is invalid`,
  mismatch: () => `Passwords must match`,
  spaceValidation: (_label, err) => err.en || 'Invalid spacing',
  numberValidation: (_label, err) => err.en || 'Can only contain numbers',
  letterValidation: (_label, err) => err.en || 'Can only contain letters',
  letterNumberValidation: (_label, err) =>
    err.en || 'Can only contain letters and numbers',
  letterSpaceValidation: (_label, err) =>
    err.en || 'Can only contain letters and spaces',
  minLengthValidation: (_label, err) => err.en || 'Too short',
  maxLengthValidation: (_label, err) => err.en || 'Too long',
};

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="form-error-text">{{ message() }}</span>`,
  styleUrl: './form-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorComponent {
  private readonly _control = signal<AbstractControl | null>(null);
  private readonly _label = signal('This field');

  @Input({ required: true })
  set control(value: AbstractControl | null) {
    this._control.set(value);
  }
  get control(): AbstractControl | null {
    return this._control();
  }

  @Input()
  set label(value: string) {
    this._label.set(value || 'This field');
  }
  get label(): string {
    return this._label();
  }

  protected readonly message = computed(() => {
    const control = this._control();
    const label = this._label();
    if (!control || !control.errors) return '';

    const errors = control.errors;
    for (const key of Object.keys(errors)) {
      const mapper = ERROR_MESSAGES[key];
      if (mapper) {
        return mapper(label, errors[key]);
      }
    }
    return `${label} is invalid`;
  });
}
