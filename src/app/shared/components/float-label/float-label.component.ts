import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ContentChild,
  AfterContentInit,
  ElementRef,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-float-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="float-label-container" [class.is-floating]="isFloating()">
      <ng-content></ng-content>
      <label class="float-label-text">
        {{ label }}
        @if (required) {
          <span class="required-mark">*</span>
        }
      </label>
    </div>
  `,
  styleUrl: './float-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatLabelComponent implements AfterContentInit, OnDestroy {
  @Input() label = '';
  @Input() required = false;

  @ContentChild('inputElement', { static: false }) inputElement?: ElementRef;

  protected readonly isFloating = signal(!false);
  private observer?: MutationObserver;
  private inputTarget: HTMLInputElement | HTMLTextAreaElement | null = null;

  ngAfterContentInit(): void {
    // Attempt to find the input element automatically if not provided via template ref
    setTimeout(() => {
      this.initInputDetection();
    }, 0);
  }

  private initInputDetection(): void {
    const projected =
      this.inputElement?.nativeElement ||
      ((this.inputTarget = document.querySelector(
        '.float-label-container input, .float-label-container textarea, .float-label-container .ant-select-selection-search-input',
      )) as any);

    if (!projected) return;

    this.inputTarget = projected;

    const checkValue = () => {
      const hasValue =
        !!this.inputTarget?.value ||
        !!(this.inputTarget as any)?.placeholder ||
        !!this.inputTarget?.parentElement?.querySelector('.ant-select-selection-item');
      this.isFloating.set(hasValue || document.activeElement === this.inputTarget);
    };

    this.inputTarget?.addEventListener('focus', () => this.isFloating.set(true));
    this.inputTarget?.addEventListener('blur', () => checkValue());
    this.inputTarget?.addEventListener('input', () => checkValue());

    // For Ng-Zorro Selects and other components that might change value via JS
    this.observer = new MutationObserver(() => checkValue());
    if (this.inputTarget?.parentElement) {
      this.observer.observe(this.inputTarget.parentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    checkValue();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
