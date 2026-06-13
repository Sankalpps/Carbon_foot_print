'use server';

import { auth } from '@/lib/auth';
import { createActivity, deleteActivity, updateActivity } from '@/lib/dal/activities';
import { activitySchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types/actions';


/**
 * Add a new activity.
 */
export async function addActivity(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' };
  }

  const raw = {
    category: formData.get('category'),
    subCategory: formData.get('subCategory'),
    amount: Number(formData.get('amount')),
    unit: formData.get('unit') || '',
    date: formData.get('date'),
    notes: formData.get('notes') || '',
  };

  const parsed = activitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await createActivity(session.user.id, parsed.data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/track');
    return { success: true };
  } catch (error) {
    console.error('Add activity error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to add activity: ${errorMessage}` };
  }
}

/**
 * Remove an activity.
 */
export async function removeActivity(activityId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' };
  }

  try {
    await deleteActivity(session.user.id, activityId);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/track');
    return { success: true };
  } catch (error) {
    console.error('Remove activity error:', error);
    return { success: false, error: 'Failed to remove activity' };
  }
}

/**
 * Edit an existing activity.
 */
export async function editActivity(activityId: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' };
  }

  const raw = {
    category: formData.get('category'),
    subCategory: formData.get('subCategory'),
    amount: Number(formData.get('amount')),
    unit: formData.get('unit') || '',
    date: formData.get('date'),
    notes: formData.get('notes') || '',
  };

  const parsed = activitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await updateActivity(session.user.id, activityId, parsed.data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/track');
    return { success: true };
  } catch (error) {
    console.error('Edit activity error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to edit activity: ${errorMessage}` };
  }
}

