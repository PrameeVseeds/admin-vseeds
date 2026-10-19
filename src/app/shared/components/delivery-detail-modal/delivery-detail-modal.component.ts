import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';

export interface DeliveryDetailData {
  id: number;
  tracking: string;
  order: string;
  customer: string;
  carrier: string;
  shipped: string;
  estimated: string;
  status: string;
  statusType: string;
}

@Component({
  selector: 'app-delivery-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NzButtonModule],
  templateUrl: './delivery-detail-modal.component.html',
  styleUrl: './delivery-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryDetailModalComponent {
  private readonly _data = signal<DeliveryDetailData>({} as DeliveryDetailData);

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: DeliveryDetailData) {
    this._data.set(value ?? ({} as DeliveryDetailData));
  }
  get data(): DeliveryDetailData {
    return this._data();
  }

  close(): void {
    this.modalRef.close();
  }

  constructor(private readonly modalRef: NzModalRef) {
  }
}
