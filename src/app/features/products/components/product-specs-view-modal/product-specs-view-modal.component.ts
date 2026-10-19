import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { LucideAngularModule } from 'lucide-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-product-specs-view-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NzButtonModule],
  templateUrl: './product-specs-view-modal.component.html',
  styleUrl: './product-specs-view-modal.component.scss',
})
export class ProductSpecsViewModalComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
    const specs = value?.product?.specifications;
    const specsString = Array.isArray(specs) ? specs.join('') : specs || '';
    this.specsHtml = specsString ? this.sanitizer.bypassSecurityTrustHtml(specsString) : '';
  }
  get data(): any {
    return this._data();
  }

  protected specsHtml: SafeHtml = '';

  close(): void {
    this.modal.destroy();
  }

  constructor(
    private readonly modal: NzModalRef,
    private readonly sanitizer: DomSanitizer,
  ) {
  }
}
