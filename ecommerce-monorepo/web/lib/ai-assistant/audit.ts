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

    const activityLog = await prisma.adminActivityLog.create({
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

    // Also record into dedicated AssistantLog table
    try {
      const rowsAffected =
        typeof result?.rowsAffected === 'number'
          ? result.rowsAffected
          : typeof result?.createdCount === 'number'
          ? result.createdCount
          : typeof result?.updatedCount === 'number'
          ? result.updatedCount
          : typeof result?.deletedCount === 'number'
          ? result.deletedCount
          : typeof result?.translatedCount?.success === 'number'
          ? result.translatedCount.success
          : status === 'SUCCESS' ? 1 : 0

      await (prisma as any).assistantLog.create({
        data: {
          userId: adminId,
          actionId: actionType,
          input: payload || {},
          result: result || null,
          success: status === 'SUCCESS',
          rowsAffected,
          errorMessage: status === 'FAILED' ? (result?.error || summary) : null,
          durationMs: result?.durationMs || 0,
        },
      })
    } catch (logErr) {
      console.error('[AI Audit] Failed to record in AssistantLog:', logErr)
    }

    return activityLog
  } catch (error) {
    console.error('[AI Audit] Failed to record AI action log:', error)
    return null
  }
}

