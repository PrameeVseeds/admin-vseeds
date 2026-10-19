import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-review-detail-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './review-detail-modal.component.html',
  styleUrl: './review-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDetailModalComponent {
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

  approve(): void {
    this.modalRef.close({ action: 'approve', id: this.data().id });
  }

  reject(): void {
    this.modalRef.close({ action: 'reject', id: this.data().id });
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
