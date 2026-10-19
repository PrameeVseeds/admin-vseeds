export interface Admin {
  id: string;
  username?: string;
  name: string;
  role: string;
  roleId?: string;
  status: string;
  statusRaw?: string;
  statusType?: string;
  lastLogin?: string;
  lastLoginAt?: string;
  email?: string;
  [key: string]: any;
}
