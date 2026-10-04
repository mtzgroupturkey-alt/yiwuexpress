import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const cycle = await prisma.autoPilotCycle.findUnique({
          where: { id: params.id },
          include: { probes: true, decisions: true },
        });

        if (!cycle) {
          sendEvent('error', { message: 'Cycle not found' });
          controller.close();
          return;
        }

        sendEvent('cycle.status', { status: cycle.status, startedAt: cycle.startedAt });

        for (const probe of cycle.probes) {
          sendEvent('probe.completed', { department: probe.department, status: probe.status });
        }

        for (const dec of cycle.decisions) {
          sendEvent('action.proposed', { type: dec.type, severity: dec.severity });
        }

        sendEvent('cycle.completed', {
          finishedAt: cycle.finishedAt,
          criticalCount: cycle.criticalCount,
          costUsd: cycle.costUsd,
        });

        controller.close();
      } catch (err: any) {
        sendEvent('error', { message: err.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
