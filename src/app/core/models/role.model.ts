export interface Role {
  id: string;
  name: string;
  description?: string;
  members?: number;
  privileges?: string[];
  permissions?: string;
  privilegeCount?: number;
  statusType?: string;
  status?: string;
  isSystem?: boolean;
  [key: string]: any;
}
