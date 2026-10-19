export interface ActivityLog {
  id?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action?: string;
  actionType?: string;
  entityDisplayName?: string;
  resourceLabel?: string;
  resourceType?: string;
  resource?: string;
  description?: string;
  ip?: string;
  date?: string;
  hasChanges?: boolean;
  changes?: any[];
  entityType?: string;
  entityId?: string;
  actorName?: string;
  actorId?: string;
  actorType?: string;
  actorEmail?: string;
  actorRole?: string;
  metadata?: any;
  [key: string]: any;
}
