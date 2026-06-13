import { auth } from '@/lib/auth';
import { getLatestGridData } from '@/lib/carbon/grid-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send data
      const sendUpdate = async () => {
        try {
          const data = await getLatestGridData();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('Error in SSE data fetch:', err);
        }
      };

      // Send initial data immediately
      await sendUpdate();

      // Send updates every 15 seconds
      const interval = setInterval(async () => {
        try {
          await sendUpdate();
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 15000);

      // Cleanup when connection closes
      return () => {
        clearInterval(interval);
      };
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
