import { auth } from '@/lib/auth';
import { getActivities } from '@/lib/dal/activities';
import { NextResponse } from 'next/server';

/**
 * GET /api/export
 * Export user's carbon footprint data as a CSV file.
 * Requires authentication.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activities = await getActivities(session.user.id, { limit: 10000, orderBy: 'date', order: 'desc' });

  // Build CSV
  const headers = ['Date', 'Category', 'Sub-Category', 'Amount', 'Unit', 'CO2 (kg)', 'Notes'];
  const rows = activities.map((a) => [
    a.date.toISOString().split('T')[0],
    a.category,
    a.subCategory,
    a.amount,
    a.unit,
    a.co2Amount,
    (a.notes || '').replace(/,/g, ';'),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="carbonwise-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
