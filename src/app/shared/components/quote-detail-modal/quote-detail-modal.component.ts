import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-quote-detail-modal',
  standalone: true,
  imports: [CommonModule, NzButtonModule, LucideAngularModule],
  templateUrl: './quote-detail-modal.component.html',
  styleUrl: './quote-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailModalComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
  }
  get data() {
    return this._data;
  }

  close(): void {
    this.modalRef.close();
  }

  respond(): void {
    this.modalRef.close({ action: 'respond', id: this.data().id });
  }

  reject(): void {
    this.modalRef.close({ action: 'reject', id: this.data().id });
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
