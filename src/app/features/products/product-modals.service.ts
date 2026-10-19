import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { ProductSpecsViewModalComponent } from './components/product-specs-view-modal/product-specs-view-modal.component';
import { ProductImagesModalComponent } from './components/product-images-modal/product-images-modal.component';
import { ProductSpecsModalComponent } from './components/product-specs-modal/product-specs-modal.component';
import { ImagePreviewModalComponent } from '@shared/components/image-preview-modal/image-preview-modal.component';
import { PdfViewerModalComponent } from '@shared/components/pdf-viewer-modal/pdf-viewer-modal.component';
import { openModal, openConfirm } from 'src/app/shared/utils/modal-helpers';
import { NzModalService } from 'ng-zorro-antd/modal';

@Injectable()
export class ProductModalsService {
  constructor(
    private readonly modalService: NzModalService,
    private readonly productService: ProductService,
    private readonly message: NzMessageService,
  ) {}

  viewProduct(product: any): void {
    this.productService.loadById(product.id).subscribe({
      next: (res: any) => {
        const full = res?.data || res || product;
        openModal(this.modalService, {
          content: ProductDetailsComponent,
          data: full,
          width: '800px',
          className: 'media-preview-modal',
          closable: true,
          maskClosable: true,
        });
      },
      error: () => {
        openModal(this.modalService, {
          content: ProductDetailsComponent,
          data: product,
          width: '800px',
          className: 'media-preview-modal',
          closable: true,
          maskClosable: true,
        });
      },
    });
  }

  viewSpecs(product: any): void {
    openModal(this.modalService, {
      content: ProductSpecsViewModalComponent,
      data: { product },
      width: '680px',
      closable: true,
      className: 'specs-view-modal',
    });
  }

  previewImage(imageUrl: string, title: string): void {
    openModal(this.modalService, {
      content: ImagePreviewModalComponent,
      data: { images: [imageUrl], title },
      width: '700px',
      className: 'image-preview-modal',
    });
  }

  previewAllImages(product: any): void {
    this.productService.loadById(product.id).subscribe({
      next: (res: any) => {
        const full = res?.data || res || product;
        const allImages = [
          ...(full.thumbnailImage ? [full.thumbnailImage] : []),
          ...(full.otherImages ?? full.images ?? []).filter(
            (url: string) => url && url !== full.thumbnailImage,
          ),
        ];
        if (!allImages.length) return;
        openModal(this.modalService, {
          content: ImagePreviewModalComponent,
          data: { images: allImages, title: full.name },
          width: '700px',
          className: 'image-preview-modal',
        });
      },
      error: () => {
        if (!product.thumbnailImage) return;
        openModal(this.modalService, {
          content: ImagePreviewModalComponent,
          data: { images: [product.thumbnailImage], title: product.name },
          width: '700px',
          className: 'image-preview-modal',
        });
      },
    });
  }

  openDataSheet(product: any): void {
    const url = product.datasheetUrl || product.dataSheet;
    if (!url) return;
    openModal(this.modalService, {
      content: PdfViewerModalComponent,
      data: { url, title: product.name },
      width: '900px',
      className: 'pdf-preview-modal',
    });
  }

  openAddImages(thumbnailFile: any[] = [], otherFiles: any[] = [], imagePrompt = ''): any {
    return openModal(this.modalService, {
      content: ProductImagesModalComponent,
      data: { thumbnailFile, otherFiles, imagePrompt },
      width: '640px',
    });
  }

  openEditSpecifications(specifications: any): any {
    return openModal(this.modalService, {
      content: ProductSpecsModalComponent,
      data: { specifications },
      width: '720px',
      title: 'Product Specifications',
    });
  }

  deleteProduct(id: string): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Product',
      description:
        'Are you sure you want to delete this product? This action cannot be undone and will remove it from the catalog.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.productService.delete(id);
        this.message.success('Product deleted');
      }
    });
  }
}
