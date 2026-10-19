import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { LucideAngularModule } from 'lucide-angular';
import { ImageService } from 'src/app/core/services/imageService';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import { NzIconModule } from 'ng-zorro-antd/icon';

interface GalleryImage {
  id: string;
  name: string;
  type: string;
  size: string;
  color: string;
  folder: string;
  url: string;
}

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [
    FormsModule,
    NzTooltipModule,
    NzModalModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzDividerModule,
    LucideAngularModule,
    NzIconModule,
  ],
  templateUrl: './imageGallery.html',
  styleUrl: './imageGallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryComponent {
  protected readonly folders = signal<string[]>([
    'Products',
    'Banners',
    'Blog',
    'Categories',
    'General',
  ]);

  protected readonly searchTerm = signal('');
  protected readonly activeTab = signal<string>('all');
  protected readonly activeFolder = signal<string>('all');
  protected readonly isDragOver = signal(false);

  isMoveModalVisible = false;
  moveTarget: GalleryImage | null = null;
  selectedFolder: string | null = null;

  isCreateFolderVisible = false;
  newFolderName = '';

  isPreviewVisible = false;
  previewImage: GalleryImage | null = null;

  readonly typeTabs = [
    { label: 'All', value: 'all' },
    { label: 'PNG', value: 'PNG' },
    { label: 'JPG', value: 'JPG' },
    { label: 'WEBP', value: 'WEBP' },
  ];

  protected images: any;
  protected totalCount: any;
  protected currentPage: any;
  protected totalPages: any;
  protected folderCounts: any;
  protected typeCounts: any;
  protected pngCount: any;
  protected jpgCount: any;
  protected webpCount: any;
  protected filteredImages: any;

  getTabCount(tabValue: string): number {
    if (tabValue === 'all') return this.totalCount();
    return this.typeCounts()[tabValue] || 0;
  }

  getFolderCount(folder: string): number {
    return this.folderCounts()[folder] || 0;
  }

  onCreateFolder(): void {
    this.newFolderName = '';
    this.isCreateFolderVisible = true;
  }

  confirmCreateFolder(): void {
    const trimmed = this.newFolderName.trim();
    if (!trimmed) return;

    if (this.folders().includes(trimmed)) {
      this.message.warning(`Folder "${trimmed}" already exists`);
      return;
    }

    this.folders.update((list: any) => [...list, trimmed]);
    this.message.success(`Folder "${trimmed}" created`);
    this.isCreateFolderVisible = false;
    this.newFolderName = '';
  }

  onMoveToFolder(image: GalleryImage): void {
    this.moveTarget = image;
    this.selectedFolder = image.folder;
    this.isMoveModalVisible = true;
  }

  confirmMove(): void {
    if (this.moveTarget && this.selectedFolder) {
      const oldFolder = this.moveTarget.folder;
      const targetId = this.moveTarget.id;
      this.images.update((list: any) =>
        list.map((i: any) => (i.id === targetId ? { ...i, folder: this.selectedFolder! } : i)),
      );
      this.message.success(
        `Moved "${this.moveTarget.name}" from ${oldFolder} to ${this.selectedFolder}`,
      );
    }
    this.isMoveModalVisible = false;
    this.moveTarget = null;
    this.selectedFolder = null;
  }

  addFolderInline(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.folders().includes(value)) {
      this.folders.update((list: any) => [...list, value]);
      this.selectedFolder = value;
      this.message.success(`Folder "${value}" created`);
    }
    input.value = '';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    const targetFolder = this.activeFolder() !== 'all' ? this.activeFolder() : 'General';

    let added = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const formData = new FormData();
      formData.append('file', file);

      this.imageService.upload(formData, undefined, targetFolder.toLowerCase()).subscribe({
        next: () => {
          added++;
          if (added === files.length) {
            this.message.success(
              `${added} image${added > 1 ? 's' : ''} uploaded to ${targetFolder}`,
            );
          }
        },
        error: () => this.message.error(`Failed to upload ${file.name}`),
      });
    }

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.onFilesSelected({ target: { files } } as unknown as Event);
    }
  }

  onConvertToWebp(image: GalleryImage): void {
    const newName = image.name.replace(/\.\w+$/, '.webp');
    this.images.update((list: any) =>
      list.map((i: any) => (i.id === image.id ? { ...i, name: newName, type: 'WEBP' } : i)),
    );
    this.message.success(`Converted "${image.name}" to WebP`);
  }

  onPreview(image: GalleryImage): void {
    this.previewImage = image;
    this.isPreviewVisible = true;
  }

  closePreview(): void {
    this.isPreviewVisible = false;
    this.previewImage = null;
  }

  onCopyUrl(image: GalleryImage): void {
    navigator.clipboard.writeText(image.url).then(() => {
      this.message.success('URL copied to clipboard');
    });
  }

  onDelete(image: GalleryImage): void {
    const modal = openConfirm(this.modalService, {
      title: 'Delete Image',
      description: `Are you sure you want to delete "${image.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconName: 'trash-2',
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.imageService.delete(image.id);
        this.message.success(`"${image.name}" deleted`);
      }
    });
  }

  loadMoreImages() {
    this.imageService.loadMore();
  }

    constructor(private readonly modalService: NzModalService, private readonly message: NzMessageService, private readonly imageService: ImageService) {
        this.images = this.imageService.getAll();
        this.totalCount = this.imageService.totalCount;
        this.currentPage = this.imageService.currentPage;
        this.totalPages = this.imageService.totalPages;
        this.folderCounts = this.imageService.folderCounts;
        this.typeCounts = this.imageService.typeCounts;
        this.pngCount = computed(
            () => this.images().filter((i: any) => i.type === 'PNG').length,
          );
        this.jpgCount = computed(
            () => this.images().filter((i: any) => i.type === 'JPG').length,
          );
        this.webpCount = computed(
            () => this.images().filter((i: any) => i.type === 'WEBP').length,
          );
        this.filteredImages = computed(() => {
            const term = this.searchTerm().toLowerCase().trim();
            const tab = this.activeTab();
            const folder = this.activeFolder();

            let list = this.images();

            if (folder !== 'all') {
              list = list.filter((i: any) => i.folder === folder);
            }

            if (tab !== 'all') {
              list = list.filter((i: any) => i.type === tab);
            }

            if (term) {
              list = list.filter((i: any) =>
                  i.name.toLowerCase().includes(term) ||
                  i.type.toLowerCase().includes(term) ||
                  i.folder.toLowerCase().includes(term),
              );
            }

            return list;
          });
    }
}
