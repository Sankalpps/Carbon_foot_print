import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getActivities } from '@/lib/dal/activities';
import PredictionsClient from './PredictionsClient';

export const dynamic = 'force-dynamic';

export default async function PredictionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user activities
  const activities = await getActivities(session.user.id, { limit: 1000 });

  // Format dates to avoid next.js serialization error
  const formattedActivities = activities.map((act) => ({
    id: act.id,
    category: act.category,
    subCategory: act.subCategory,
    co2Amount: act.co2Amount,
    date: act.date.toISOString(),
  }));

  return <PredictionsClient activities={formattedActivities} userId={session.user.id} />;
}
