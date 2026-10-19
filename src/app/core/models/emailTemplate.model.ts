export interface EmailTemplate {
  id: string;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  variables?: any[];
  isActive?: boolean;
  status?: string;
  lastModified?: string;
  updatedAt?: string;
  [key: string]: any;
}
