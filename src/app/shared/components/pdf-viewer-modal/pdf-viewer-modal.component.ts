import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface PdfViewerModalData {
  url: string;
  title: string;
}

@Component({
  selector: 'app-pdf-viewer-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrl: './pdf-viewer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewerModalComponent {
  private readonly _data = signal<PdfViewerModalData>({ url: '', title: '' });

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: PdfViewerModalData) {
    this._data.set(value ?? { url: '', title: '' });
    this.safeUrl = value?.url
      ? this.sanitizer.bypassSecurityTrustResourceUrl(value.url)
      : null;
  }
  get data(): PdfViewerModalData {
    return this._data();
  }

  safeUrl: SafeResourceUrl | null = null;

  constructor(private readonly modalRef: NzModalRef, private readonly sanitizer: DomSanitizer) {
  }

  close(): void {
    this.modalRef.close();
  }

  openExternal(): void {
    window.open(this.data?.url, '_blank');
  }

  download(): void {
    const link = document.createElement('a');
    link.href = this.data?.url;
    link.download = this.data?.title + '.pdf';
    link.click();
  }
}
