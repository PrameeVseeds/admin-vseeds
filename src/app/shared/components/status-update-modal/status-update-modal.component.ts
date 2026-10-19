import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule } from 'lucide-angular';

export interface StatusOption {
  value: string;
  label: string;
  icon: string;
  color: string;
  bgClass: string;
}

export interface StatusUpdateData {
  entityId: string;
  subtitle: string;
  currentStatus: string;
  title?: string;
  options?: StatusOption[];
}

const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: 'Pending', label: 'Pending', icon: 'clock', color: '#f59e0b', bgClass: 'opt--warning' },
  { value: 'Waiting for Payment', label: 'Waiting for Payment', icon: 'wallet', color: '#f97316', bgClass: 'opt--warning' },
  { value: 'Processing', label: 'Processing', icon: 'settings', color: '#f59e0b', bgClass: 'opt--warning' },
  { value: 'Shipped', label: 'Shipped', icon: 'truck', color: '#3b82f6', bgClass: 'opt--info' },
  { value: 'Delivered', label: 'Delivered', icon: 'check-circle', color: '#10b981', bgClass: 'opt--success' },
  { value: 'Cancelled', label: 'Cancelled', icon: 'x-circle', color: '#ef4444', bgClass: 'opt--error' },
  { value: 'Refunded', label: 'Refunded', icon: 'rotate-ccw', color: '#8b5cf6', bgClass: 'opt--error' },
];

@Component({
  selector: 'app-status-update-modal',
  standalone: true,
  imports: [CommonModule, NzButtonModule, LucideAngularModule],
  templateUrl: './status-update-modal.component.html',
  styleUrls: ['./status-update-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusUpdateModalComponent {
  private readonly _data = signal<StatusUpdateData>({} as StatusUpdateData);

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: StatusUpdateData) {
    this._data.set(value ?? ({} as StatusUpdateData));
    this.selected.set(value?.currentStatus ?? '');
    this.modalTitle = value?.title ?? 'Update Status';
    this.options = value?.options ?? ORDER_STATUS_OPTIONS;
  }
  get data(): StatusUpdateData {
    return this._data();
  }

  readonly selected = signal<string>('');
  modalTitle = 'Update Status';
  options: StatusOption[] = ORDER_STATUS_OPTIONS;

  get hasChanged(): boolean {
    return this.selected() !== this.data?.currentStatus;
  }

  select(value: string): void {
    this.selected.set(value);
  }

  confirm(): void {
    this.modalRef.close(this.selected());
  }

  close(): void {
    this.modalRef.close(null);
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
