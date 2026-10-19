import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { QuillModule } from 'ngx-quill';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-product-specs-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule, NzButtonModule],
  templateUrl: './product-specs-modal.component.html',
  styleUrl: './product-specs-modal.component.scss',
})
export class ProductSpecsModalComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
    const raw = value?.specifications;
    this.specsControl.setValue(Array.isArray(raw) ? raw[0] || '' : (raw || ''));
  }
  get data(): any {
    return this._data();
  }

  protected readonly specsControl = new FormControl('');

  protected readonly quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link'],
      ['clean'],
    ],
  };

  save(): void {
    this.modal.close(this.specsControl.value);
  }

  cancel(): void {
    this.modal.destroy();
  }

    constructor(private readonly modal: NzModalRef) {
    }
}
