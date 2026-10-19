export interface Contact {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  subject?: string;
  date?: string;
  createdAt?: string;
  status?: string;
  statusType?: string;
  [key: string]: any;
}
