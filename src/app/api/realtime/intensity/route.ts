import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLatestGridData } from '@/lib/carbon/grid-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getLatestGridData();
    return NextResponse.json(data);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to fetch carbon intensity data' },
      { status: 500 }
    );
  }
}
