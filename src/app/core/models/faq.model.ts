export interface Faq {
  id: string;
  question?: string;
  answer?: string;
  displayOrder?: number;
  order?: number;
  isActive?: boolean;
  status?: string;
  statusType?: string;
  [key: string]: any;
}
