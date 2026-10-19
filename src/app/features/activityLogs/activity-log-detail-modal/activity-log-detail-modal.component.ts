import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { DateTimePipe } from 'src/app/shared/pipes/date-format.pipe';

@Component({
  selector: 'app-activity-log-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DateTimePipe],
  templateUrl: './activity-log-detail-modal.component.html',
  styleUrl: './activity-log-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogDetailModalComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
  }
  get data(): any {
    return this._data();
  }

  /** Alias kept for template compatibility. */
  get log(): any {
    return this.data;
  }

  get changes(): Array<{ field: string; from: any; to: any }> {
    return this.log?.changes ?? this.log?.metadata?.changes ?? [];
  }

  get hasChanges(): boolean {
    return this.changes.length > 0;
  }

  get oldData(): any {
    return this.log?.metadata?.oldData ?? null;
  }

  get newData(): any {
    return this.log?.metadata?.newData ?? null;
  }

  formatField(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  }

  formatValue(val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  }

  close(): void {
    this.modalRef.close();
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
