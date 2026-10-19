import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-contact-detail-modal',
  standalone: true,
  imports: [FormsModule, NzInputModule, LucideAngularModule],
  templateUrl: './contact-detail-modal.component.html',
  styleUrl: './contact-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDetailModalComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
  }
  get data() {
    return this._data;
  }

  readonly showReply = signal(false);
  replyMessage = '';

  close(): void {
    this.modalRef.close();
  }

  toggleReply(): void {
    this.showReply.update((v: any) => !v);
  }

  sendReply(): void {
    if (this.replyMessage.trim()) {
      this.modalRef.close({ action: 'reply', id: this.data().id, message: this.replyMessage });
    }
  }

  markAsRead(): void {
    this.modalRef.close({ action: 'read', id: this.data().id });
  }

  archive(): void {
    this.modalRef.close({ action: 'archive', id: this.data().id });
  }

  markResolved(): void {
    this.modalRef.close({ action: 'resolve', id: this.data().id });
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
