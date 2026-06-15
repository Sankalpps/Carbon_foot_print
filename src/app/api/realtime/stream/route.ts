import { auth } from '@/lib/auth';
import { getLatestGridData } from '@/lib/carbon/grid-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: any;

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send data
      const sendUpdate = async () => {
        try {
          const data = await getLatestGridData();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // Stream is closed, stop interval
          clearInterval(interval);
        }
      };

      // Send initial data immediately
      await sendUpdate();

      // Send updates every 15 seconds
      interval = setInterval(async () => {
        await sendUpdate();
      }, 15000);
    },
    cancel() {
      clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering on Nginx/Cloudflare
    },
  });
}
