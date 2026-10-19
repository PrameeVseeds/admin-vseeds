import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalRef } from 'ng-zorro-antd/modal';

export interface ImagePreviewModalData {
  images: string[];
  title: string;
  startIndex?: number;
}

@Component({
  selector: 'app-image-preview-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './image-preview-modal.component.html',
  styleUrl: './image-preview-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewModalComponent {
  private readonly _data = signal<ImagePreviewModalData>({ images: [], title: '' });

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: ImagePreviewModalData) {
    this._data.set(value ?? { images: [], title: '' });
    this.currentIndex.set(value?.startIndex ?? 0);
  }
  get data(): ImagePreviewModalData {
    return this._data();
  }

  readonly currentIndex = signal(0);

  get totalImages(): number {
    return this.data?.images?.length ?? 0;
  }

  readonly currentImage = computed(() => this.data?.images?.[this.currentIndex()]);

  get hasMultiple(): boolean {
    return this.totalImages > 1;
  }

  close(): void {
    this.modalRef.close();
  }

  prev(): void {
    this.currentIndex.update((i: any) => (i > 0 ? i - 1 : this.totalImages - 1));
  }

  next(): void {
    this.currentIndex.update((i: any) => (i < this.totalImages - 1 ? i + 1 : 0));
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }

  openExternal(): void {
    window.open(this.currentImage(), '_blank');
  }

    constructor(private readonly modalRef: NzModalRef) {
    }
}
