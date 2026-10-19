import { Injectable } from '@angular/core';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class CdnService {
  private readonly cdnUrl = environment.cdnUrl;
  private readonly assetBaseUrl = environment.apiBaseUrl.replace('/api', '');

  normalizeImageUrl(image: string | null | undefined, fallback: string): string {
    if (!image) return fallback;
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    if (image.startsWith('/uploads/')) {
      const filename = image.split('/').pop();
      return `${this.cdnUrl}/${filename}`;
    }
    return `${this.cdnUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  }

  normalizeImages(images: string[], fallback: string): string[] {
    if (!Array.isArray(images) || images.length === 0) {
      return [fallback];
    }
    return images.map((img) => this.normalizeImageUrl(img, fallback));
  }

  ensureFullUrl(path: string, fallback: string): string {
    if (!path) return fallback;
    if (path.startsWith('http')) {
      return path;
    }
    return `${this.assetBaseUrl}/${path}`;
  }

  defaultImage(path: string): string {
    return `${this.cdnUrl}/${path}`;
  }

  defaultAsset(path: string): string {
    return `${this.assetBaseUrl}/${path}`;
  }
}
