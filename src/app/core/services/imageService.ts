import { Injectable, signal } from '@angular/core';
import { ApiService } from './apiService';
import { tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GalleryImage } from '@models/image.model';

@Injectable({ providedIn: 'root' })
export class ImageService extends ApiService {
  readonly images = signal<GalleryImage[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly folderCounts = signal<Record<string, number>>({});
  readonly typeCounts = signal<Record<string, number>>({});

  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    if (!this._loaded) {
      this._loaded = true;
      this.loadAll();
      this.loadCounts();
    }
    return this.images;
  }

  loadCounts() {
    // Use the new counts API endpoint
    this.get<any>('images/counts').subscribe({
      next: (res) => {
        const data = res.data || {};
        
        // Transform folder counts to match expected format
        const counts: Record<string, number> = {
          'Products': data.folderCounts?.Products || 0,
          'Banners': data.folderCounts?.Banners || 0,
          'Blog': data.folderCounts?.Blog || 0,
          'Categories': data.folderCounts?.Categories || 0,
          'General': data.folderCounts?.General || 0,
        };
        
        // Transform type counts to match expected format
        const typeCounts: Record<string, number> = {
          'PNG': data.typeCounts?.PNG || 0,
          'JPG': data.typeCounts?.JPG || 0,
          'WEBP': data.typeCounts?.WEBP || 0,
        };
        
        this.folderCounts.set(counts);
        this.typeCounts.set(typeCounts);
      },
      error: () => {
        // Fallback to empty counts if API fails
        this.folderCounts.set({
          'Products': 0,
          'Banners': 0,
          'Blog': 0,
          'Categories': 0,
          'General': 0,
        });
        this.typeCounts.set({
          'PNG': 0,
          'JPG': 0,
          'WEBP': 0,
        });
      },
    });
  }

  loadAll(page: number = 1, limit: number = 20) {
    this._loading.set(true);
    this._error.set(null);
    this.get<any>(`images/gallery?page=${page}&limit=${limit}`).subscribe({
      next: (res) => {
        const rawImages = this.extractArray(res.data?.images || res.data || []);
        const mappedImages: GalleryImage[] = rawImages.map((img: any): GalleryImage => {
          // Extract folder from filename based on the actual structure
          let folder = 'General';
          if (img.filename.includes('vseeds-')) {
            const parts = img.filename.split('-');
            if (parts.length >= 2) {
              folder = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
            }
          } else if (img.filename.includes('thumbnail_') || img.filename.includes('images_')) {
            folder = 'Products';
          }

          const type = img.mimeType ? img.mimeType.split('/')[1].toUpperCase() : 'IMG';
          const size = this.formatFileSize(img.fileSize);

          return {
            id: img.id,
            name: img.originalName || img.filename,
            type: type,
            size: size,
            color: this.getRandomColor(),
            folder: folder,
            url: img.url,
          };
        });
        
        // Update pagination info
        this.totalCount.set(res.data?.total || res.data?.total || 0);
        this.totalPages.set(res.data?.totalPages || 1);
        this.currentPage.set(page);
        
        // Append images for pagination, or replace if page 1
        if (page === 1) {
          this.images.set(mappedImages);
        } else {
          this.images.update(list => [...list, ...mappedImages]);
        }
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this._error.set(err?.error?.message || 'Failed to load images');
        this.images.set([]);
      },
    });
  }

  loadMore() {
    if (this.currentPage() < this.totalPages()) {
      this.loadAll(this.currentPage() + 1, 20);
    }
  }

  private formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getRandomColor(): string {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  upload(formData: FormData, name?: string, folder?: string) {
    const newFormData = new FormData();
    if (name) newFormData.append('name', name);
    if (folder) newFormData.append('folder', folder);
    formData.forEach((value: any, key: any) => {
      newFormData.append(key, value);
    });
    return this.postForm<any>('images/upload', newFormData).pipe(tap(() => this.loadAll()));
  }

  uploadForProduct(productId: string, formData: FormData, name?: string, folder = 'products') {
    const newFormData = new FormData();
    if (name) newFormData.append('name', name);
    if (folder) newFormData.append('folder', folder);
    formData.forEach((value: any, key: any) => {
      newFormData.append(key, value);
    });
    return this.postForm<any>(`images/images/${productId}`, newFormData).pipe(
      tap(() => this.loadAll()),
    );
  }

  uploadThumbnail(productId: string, formData: FormData, name?: string, folder = 'products') {
    const newFormData = new FormData();
    if (name) newFormData.append('name', name);
    if (folder) newFormData.append('folder', folder);
    formData.forEach((value: any, key: any) => {
      newFormData.append(key, value);
    });
    return this.postForm<any>(`images/thumbnail/${productId}`, newFormData).pipe(
      tap(() => this.loadAll()),
    );
  }

  delete(id: string) {
    this.del<any>(`images/delete/${id}`).subscribe({
      next: () => this.images.update((list: GalleryImage[]) => list.filter((i: GalleryImage) => i.id !== id)),
    });
  }
}
