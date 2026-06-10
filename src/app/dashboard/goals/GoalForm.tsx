'use client';

import { useState, useTransition } from 'react';
import { setGoal } from '@/app/actions/goals';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import styles from './GoalForm.module.css';

export default function GoalForm() {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form states (default to 15% reduction, starting today, ending in 1 month)
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const [targetReduction, setTargetReduction] = useState('15');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextMonthStr);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetNum = Number(targetReduction);
    if (isNaN(targetNum) || targetNum < 1 || targetNum > 100) {
      addToast({ type: 'error', title: 'Error', message: 'Target reduction must be between 1% and 100%' });
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      addToast({ type: 'error', title: 'Error', message: 'End date must be after the start date' });
      return;
    }

    const formData = new FormData();
    formData.append('targetReduction', targetReduction);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);

    startTransition(async () => {
      const result = await setGoal(formData);
      if (result.success) {
        addToast({ type: 'success', title: 'Success', message: 'Goal configured successfully!' });
      } else {
        addToast({ type: 'error', title: 'Error', message: result.error || 'Failed to update goal' });
      }
    });
  };

  return (
    <Card variant="glass" className={styles.formCard}>
      <h2 className={styles.formTitle}>Set Reduction Target</h2>
      <p className={styles.formSubtitle}>
        Your baseline average will be computed automatically from your activity logs over the past month.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldGroup}>
          <Input
            id="targetReduction"
            name="targetReduction"
            label="Target Reduction (%)"
            type="number"
            min="1"
            max="100"
            value={targetReduction}
            onChange={(e) => setTargetReduction(e.target.value)}
            placeholder="e.g. 15"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <Input
            id="startDate"
            name="startDate"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <Input
            id="endDate"
            name="endDate"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={isPending}
          fullWidth
        >
          {isPending ? 'Saving Target...' : 'Configure Goal'}
        </Button>
      </form>
    </Card>
  );
}
