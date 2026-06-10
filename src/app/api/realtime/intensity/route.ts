import { NextResponse } from 'next/server';
import { getLatestGridData } from '@/lib/carbon/grid-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLatestGridData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch carbon intensity data' },
      { status: 500 }
    );
  }
}
