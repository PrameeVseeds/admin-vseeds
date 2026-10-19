import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ImagePreviewModalComponent } from '@shared/components/image-preview-modal/image-preview-modal.component';
import { PdfViewerModalComponent } from '@shared/components/pdf-viewer-modal/pdf-viewer-modal.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    NzModalModule,
    NzDescriptionsModule,
    NzTagModule,
    CurrencyPipe,
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
  }
  get data(): any {
    return this._data();
  }

  /** Alias kept for template compatibility. */
  get product(): any {
    return this.data;
  }

  get attributes(): { name: string; value: string; isSimilarFilter?: boolean }[] {
    const list = this.product?.attributes || this.product?.productAttributes || [];
    return (list as any[]).map((a: any) => ({
      name: a.name || a.attribute?.name || '',
      value: a.value ?? a.attributeValue ?? '',
      isSimilarFilter: a.isSimilarFilter,
    }));
  }

  get statusType(): string {
    const status = this.product?.status?.toLowerCase();
    if (status === 'active') return 'success';
    if (status === 'out_of_stock' || status === 'discontinued' || status === 'draft') return 'warning';
    if (status === 'inactive') return 'error';
    return 'info';
  }

  get specsHtml(): string {
    const raw = this.product?.specifications;
    if (!raw) return '';
    if (Array.isArray(raw)) return raw.join('');
    return String(raw);
  }

  previewImage(imageUrl: string, title: string): void {
    openModal(this.modalService, {
      content: ImagePreviewModalComponent,
      data: { images: [imageUrl], title },
      width: '700px',
      className: 'image-preview-modal',
    });
  }

  previewAllImages(): void {
    const allImages = [
      ...(this.product.thumbnailImage ? [this.product.thumbnailImage] : []),
      ...(this.product.otherImages ?? []),
    ];
    if (!allImages.length) return;
    openModal(this.modalService, {
      content: ImagePreviewModalComponent,
      data: { images: allImages, title: this.product.name },
      width: '700px',
      className: 'image-preview-modal',
    });
  }

  openDataSheet(): void {
    if (!this.product.dataSheet) return;
    openModal(this.modalService, {
      content: PdfViewerModalComponent,
      data: { url: this.product.dataSheet, title: this.product.name },
      width: '900px',
      className: 'pdf-preview-modal',
    });
  }

    constructor(private readonly modalService: NzModalService) {
    }
}
