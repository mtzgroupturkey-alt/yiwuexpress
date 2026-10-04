export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      let counter = 0;

      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          isClosed = true;
          if (interval) clearInterval(interval);
        }
      };

      // Send initial heartbeat
      sendEvent('brain.state', {
        status: 'analyzing',
        overallHealth: 88,
        timestamp: new Date().toISOString(),
      });

      interval = setInterval(() => {
        if (isClosed) {
          if (interval) clearInterval(interval);
          return;
        }

        counter++;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (counter % 4 === 0) {
          sendEvent('event.new', {
            time: now,
            dept: 'security',
            message: `Synaptic packet analyzed from firewall proxy [Seq ${counter}]`,
            severity: 'info',
          });
        }

        if (counter % 10 === 0) {
          sendEvent('cycle.progress', {
            phase: 'Probing 10 Departments',
            percent: (counter * 5) % 100,
          });
        }
      }, 3000);
    },
    cancel() {
      isClosed = true;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
