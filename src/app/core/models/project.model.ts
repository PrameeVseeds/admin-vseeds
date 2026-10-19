export interface Project {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  statusType?: string;
  isPublic?: boolean;
  imageUrl?: string;
  client?: string;
  category?: string;
  technologies?: string | string[];
  [key: string]: any;
}
