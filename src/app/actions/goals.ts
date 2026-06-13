'use server';

import { auth } from '@/lib/auth';
import { createGoal } from '@/lib/dal/goals';
import { goalSchema } from '@/lib/validations';
import { getActivityStats } from '@/lib/dal/activities';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/actions';


/**
 * Set a carbon reduction goal.
 */
export async function setGoal(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' };
  }

  // Calculate baseline from last month's data
  const stats = await getActivityStats(session.user.id, 'month');
  const baselineCo2 = stats.totalCO2 > 0 ? stats.totalCO2 : 300; // Default baseline

  const raw = {
    targetReduction: Number(formData.get('targetReduction')),
    baselineCo2,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
  };

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await createGoal(session.user.id, parsed.data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/goals');
    return { success: true };
  } catch (error) {
    console.error('Set goal error:', error);
    return { success: false, error: 'Failed to set goal' };
  }
}
