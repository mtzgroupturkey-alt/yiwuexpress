import { prisma } from '@/lib/db'

export interface CreateAuditLogParams {
  userId?: string | null
  action: string      // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'BULK_UPDATE' | 'BULK_DELETE'
  resource: string    // 'ORDER' | 'PRODUCT' | 'USER' | 'SETTINGS' | 'PURCHASE_ORDER'
  resourceId?: string | null
  changes?: any
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Persist an audit record to the database
 */
export async function logActivity({
  userId,
  action,
  resource,
  resourceId,
  changes,
  ipAddress,
  userAgent,
}: CreateAuditLogParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        resource,
        resourceId: resourceId || null,
        changes: changes ? JSON.parse(JSON.stringify(changes)) : undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })
  } catch (err) {
    console.error('Failed to log audit activity:', err)
    return null
  }
}
