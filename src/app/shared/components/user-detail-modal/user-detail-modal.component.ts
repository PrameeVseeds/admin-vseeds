import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-user-detail-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './user-detail-modal.component.html',
  styleUrl: './user-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailModalComponent {
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

  toggleStatus(): void {
    const newStatus = this.data().status === 'Active' ? 'Inactive' : 'Active';
    const newType = newStatus === 'Active' ? 'success' : 'error';
    this.modalRef.close({
      action: 'toggleStatus',
      id: this.data().id,
      status: newStatus,
      type: newType,
    });
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
