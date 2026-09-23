import { prisma } from '@/lib/db'
import { PendingActionType } from './types'

export interface LogAiActionParams {
  adminId: string
  actionType: PendingActionType | string
  summary: string
  payload: any
  result?: any
  status?: 'SUCCESS' | 'FAILED' | 'CANCELLED'
  ipAddress?: string
  userAgent?: string
}

/**
 * Log all AI write actions to AdminActivityLog for safety, auditing, and compliance.
 */
export async function logAiAction(params: LogAiActionParams) {
  try {
    const {
      adminId,
      actionType,
      summary,
      payload,
      result,
      status = 'SUCCESS',
      ipAddress,
      userAgent,
    } = params

    // Verify admin user exists to satisfy foreign key constraint
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true },
    })

    if (!admin) {
      console.warn(`[AI Audit] Cannot log AI action: Admin user ${adminId} not found`)
      return null
    }

    return await prisma.adminActivityLog.create({
      data: {
        adminId,
        action: `AI_${actionType.toUpperCase()}`,
        entity: 'AI_ASSISTANT',
        entityId: actionType,
        changes: {
          summary,
          status,
          payload,
          result: result || null,
          executedAt: new Date().toISOString(),
        },
        ipAddress: ipAddress || null,
        userAgent: userAgent || 'Dromkok-AI-Assistant',
      },
    })
  } catch (error) {
    console.error('[AI Audit] Failed to record AI action log:', error)
    return null
  }
}
