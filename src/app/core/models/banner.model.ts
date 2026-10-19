export interface Banner {
  id: string;
  deviceType?: string;
  position?: string;
  startsAt?: string;
  endsAt?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  status?: string;
  statusType?: string;
  clicks?: number;
  image?: string;
  title?: string;
  [key: string]: any;
}
