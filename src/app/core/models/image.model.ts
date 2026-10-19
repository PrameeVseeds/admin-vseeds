export interface GalleryImage {
  id: string;
  name: string;
  type: string;
  size: string;
  color: string;
  folder: string;
  url: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  [key: string]: any;
}
