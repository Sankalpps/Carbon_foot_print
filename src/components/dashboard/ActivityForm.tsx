'use client';

import { useState, useEffect, useTransition } from 'react';
import { addActivity } from '@/app/actions/activities';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { CATEGORY_META, getFactorsByCategory, getUnit, getEmissionFactor } from '@/lib/carbon/emission-factors';
import type { Category } from '@/lib/validations';
import { calculateCO2 } from '@/lib/carbon/calculator';
import styles from './ActivityForm.module.css';

export default function ActivityForm() {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [category, setCategory] = useState<Category>('transport');
  const [subCategory, setSubCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Live calculation preview
  const [co2Preview, setCo2Preview] = useState<number>(0);

  // List of sub-categories for current category
  const subCategories = getFactorsByCategory(category);

  // Set default subcategory when category changes
  useEffect(() => {
    if (subCategories.length > 0) {
      setSubCategory(subCategories[0].subCategory);
    }
  }, [category, subCategories]);

  // Update real-time CO2 preview
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && subCategory) {
      const calculated = calculateCO2(subCategory, numAmount);
      setCo2Preview(calculated);
    } else {
      setCo2Preview(0);
    }
  }, [amount, subCategory]);

  const unit = subCategory ? getUnit(subCategory) : '';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subCategory) {
      addToast({ type: 'error', title: 'Error', message: 'Please select a sub-category' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a valid positive amount' });
      return;
    }

    const formData = new FormData();
    formData.append('category', category);
    formData.append('subCategory', subCategory);
    formData.append('amount', amount);
    formData.append('unit', unit);
    formData.append('date', date);
    formData.append('notes', notes);

    startTransition(async () => {
      const result = await addActivity(formData);
      if (result.success) {
        addToast({ type: 'success', title: 'Success', message: 'Activity logged successfully!' });
        // Reset form
        setAmount('');
        setNotes('');
      } else {
        addToast({ type: 'error', title: 'Error', message: result.error || 'Failed to log activity' });
      }
    });
  };

  return (
    <Card variant="glass" className={styles.formContainer}>
      <h2 className={styles.title}>Log New Activity</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Category Cards Selection */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Choose Category</legend>
          <div className={styles.categoryGrid}>
            {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`${styles.categoryCard} ${isSelected ? styles.categoryCardSelected : ''}`}
                  aria-pressed={isSelected}
                  style={{
                    '--accent-color': meta.color,
                  } as React.CSSProperties}
                >
                  <span className={styles.categoryIcon} aria-hidden="true">
                    {meta.icon}
                  </span>
                  <span className={styles.categoryLabel}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Sub-category & Amount Row */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label htmlFor="subCategory" className={styles.label}>
              Sub-Category
            </label>
            <select
              id="subCategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className={styles.select}
              required
            >
              {subCategories.map((sc) => (
                <option key={sc.subCategory} value={sc.subCategory}>
                  {sc.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <Input
              id="amount"
              name="amount"
              label={`Amount (${unit})`}
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50"
              required
            />
          </div>
        </div>

        {/* Date & Notes */}
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <Input
              id="date"
              name="date"
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="notes" className={styles.label}>
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Commute to office"
              className={styles.textarea}
              maxLength={200}
            />
          </div>
        </div>

        {/* Carbon Preview Summary */}
        {co2Preview > 0 && (
          <div className={styles.previewContainer} aria-live="polite">
            <span className={styles.previewLabel}>Estimated Emissions:</span>
            <span className={styles.previewValue}>
              {co2Preview.toFixed(2)} <span className={styles.previewUnit}>kg CO₂e</span>
            </span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          disabled={isPending}
          fullWidth
        >
          {isPending ? 'Logging Activity...' : 'Log Activity'}
        </Button>
      </form>
    </Card>
  );
}
