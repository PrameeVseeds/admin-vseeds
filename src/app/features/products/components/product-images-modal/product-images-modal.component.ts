import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule } from 'lucide-angular';
import { ImagePreviewModalComponent } from '@shared/components/image-preview-modal/image-preview-modal.component';
import { openModal } from 'src/app/shared/utils/modal-helpers';

@Component({
  selector: 'app-product-images-modal',
  standalone: true,
  imports: [CommonModule, NzUploadModule, NzButtonModule, LucideAngularModule],
  templateUrl: './product-images-modal.component.html',
  styleUrl: './product-images-modal.component.scss',
})
export class ProductImagesModalComponent {
  private readonly _data = signal<any>({});

  /** Modal data assigned by the parent via `modal.componentInstance`. */
  set data(value: any) {
    this._data.set(value ?? {});
    this.thumbnailFile = [...(value?.thumbnailFile || [])];
    this.otherFiles = [...(value?.otherFiles || [])];
    this.imagePrompt = value?.imagePrompt || '';
  }
  get data(): any {
    return this._data();
  }

  protected thumbnailFile: NzUploadFile[] = [];
  protected otherFiles: NzUploadFile[] = [];
  private imagePrompt = '';

  beforeUploadThumbnail: any;
  beforeUploadOther: any;

  constructor(
    public readonly modal: NzModalRef,
    private readonly modalService: NzModalService,
    private readonly msg: NzMessageService,
  ) {

    this.beforeUploadThumbnail = (file: NzUploadFile): boolean => {
      const rawFile = this.extractRawFile(file);
      this.getBase64(rawFile).then((url) => {
        this.thumbnailFile = [this.wrapFile(file, rawFile, url)];
      });
      return false;
    };

    this.beforeUploadOther = (file: NzUploadFile): boolean => {
      if (this.otherFiles.length >= 6) {
        this.msg.warning('Maximum 6 gallery images allowed');
        return false;
      }
      const rawFile = this.extractRawFile(file);
      this.getBase64(rawFile).then((url) => {
        this.otherFiles = [...this.otherFiles, this.wrapFile(file, rawFile, url)];
      });
      return false;
    };
  }

  previewThumbnail(): void {
    const url = this.thumbnailFile[0]?.url || this.thumbnailFile[0]?.thumbUrl || (this.thumbnailFile[0] as any)?.['preview'];
    if (!url) return;
    openModal(this.modalService, {
      content: ImagePreviewModalComponent,
      data: { images: [url], title: 'Thumbnail Preview' },
      width: '700px',
      className: 'image-preview-modal',
    });
  }

  clearThumbnail(): void {
    this.thumbnailFile = [];
  }

  previewGallery(startIndex: number): void {
    const images = this.otherFiles
      .map((f: any) => f.url || f.thumbUrl || f['preview'])
      .filter(Boolean);
    if (!images.length) return;
    openModal(this.modalService, {
      content: ImagePreviewModalComponent,
      data: { images, title: 'Gallery Preview', startIndex },
      width: '700px',
      className: 'image-preview-modal',
    });
  }

  removeGalleryImage(file: NzUploadFile): void {
    this.otherFiles = this.otherFiles.filter((f) => f.uid !== file.uid);
  }

  copyImagePrompt(): void {
    if (!this.imagePrompt) {
      this.msg.warning('No image prompt available');
      return;
    }
    navigator.clipboard.writeText(this.imagePrompt).then(() => {
      this.msg.success('Prompt copied to clipboard');
    });
  }

  save(): void {
    this.modal.close({
      thumbnailFile: this.thumbnailFile,
      otherFiles: this.otherFiles,
    });
  }

  private extractRawFile(file: NzUploadFile): File {
    return file.originFileObj ?? (file as unknown as File);
  }

  private wrapFile(file: NzUploadFile, rawFile: File, dataUrl: string): NzUploadFile {
    return {
      uid: file.uid || `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name || rawFile.name,
      url: dataUrl,
      thumbUrl: dataUrl,
      originFileObj: rawFile instanceof File ? rawFile : file.originFileObj,
      status: 'done',
    };
  }

  private getBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
    });
  }
}
