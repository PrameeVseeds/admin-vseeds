export interface Blog {
  id: string;
  title?: string;
  content?: string;
  coverImageUrl?: string;
  status?: string;
  statusType?: string;
  published?: string;
  updated?: string;
  readTime?: string;
  excerpt?: string;
  author?: string;
  tags?: any[];
  publishedAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
