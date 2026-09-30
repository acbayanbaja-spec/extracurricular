import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: any;
  newData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  public static async log(input: AuditLogInput): Promise<void> {
    try {
      const id = uuidv4();
      const oldStr = input.oldData ? (typeof input.oldData === 'string' ? input.oldData : JSON.stringify(input.oldData)) : null;
      const newStr = input.newData ? (typeof input.newData === 'string' ? input.newData : JSON.stringify(input.newData)) : null;

      await db.run(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.userId || null,
          input.action,
          input.entityType,
          input.entityId || null,
          oldStr,
          newStr,
          input.ipAddress || null,
          input.userAgent || null,
        ]
      );
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
    }
  }
}
