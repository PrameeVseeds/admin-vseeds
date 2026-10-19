import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';

export interface ConfirmModalData {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  iconName?: string;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NzModalModule, NzButtonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  private readonly _data = signal<ConfirmModalData>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: ConfirmModalData) {
    this._data.set(value ?? {});
  }
  get data(): ConfirmModalData {
    return this._data();
  }

  onConfirm() {
    this.modalRef.close(true);
  }

  onCancel() {
    this.modalRef.close(false);
  }

  constructor(private readonly modalRef: NzModalRef) {
  }
}
