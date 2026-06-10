import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getActivities } from '@/lib/dal/activities';
import ActivityForm from '@/components/dashboard/ActivityForm';
import ActivityTable from '@/components/dashboard/ActivityTable';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function TrackPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const activities = await getActivities(session.user.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Track Emissions</h1>
        <p className={styles.subtitle}>
          Log your daily commute, energy use, meals, and purchases to track your carbon footprint.
        </p>
      </div>

      <div className={styles.layout}>
        {/* Form area */}
        <section className={styles.formSection} aria-labelledby="form-heading">
          <span id="form-heading" className="sr-only">Log new activity form</span>
          <ActivityForm />
        </section>

        {/* History table area */}
        <section className={styles.tableSection} aria-labelledby="history-heading">
          <span id="history-heading" className="sr-only">Activity log history</span>
          <ActivityTable activities={activities} />
        </section>
      </div>
    </div>
  );
}
