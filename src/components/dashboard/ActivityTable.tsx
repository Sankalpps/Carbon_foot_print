'use client';

import { useState, useMemo, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { removeActivity } from '@/app/actions/activities';
import { useToast } from '@/components/ui/Toast';
import { CATEGORY_META, getEmissionFactor } from '@/lib/carbon/emission-factors';
import type { Category } from '@/lib/validations';
import styles from './ActivityTable.module.css';

interface ActivityItem {
  id: string;
  category: string;
  subCategory: string;
  amount: number;
  unit: string;
  co2Amount: number;
  date: Date | string;
  isAnomaly: boolean;
  notes: string | null;
}

interface ActivityTableProps {
  activities: ActivityItem[];
}

type SortField = 'date' | 'category' | 'amount' | 'co2Amount';
type SortOrder = 'asc' | 'desc';

export default function ActivityTable({ activities }: ActivityTableProps) {
  const { addToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Filter & Sort States
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Delete Dialog States
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await removeActivity(deleteId);
      if (result.success) {
        addToast({ type: 'success', title: 'Success', message: 'Activity deleted successfully' });
      } else {
        addToast({ type: 'error', title: 'Error', message: result.error || 'Failed to delete activity' });
      }
      setDeleteId(null);
    });
  };

  // Filter and sort activities client-side
  const processedActivities = useMemo(() => {
    let result = [...activities];

    // Filter
    if (categoryFilter !== 'all') {
      result = result.filter((a) => a.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Format date if string
      if (sortField === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activities, categoryFilter, sortField, sortOrder]);

  const formatDate = (dateVal: Date | string) => {
    return new Date(dateVal).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.tableWrapper}>
      {/* Table Controls */}
      <div className={styles.controls}>
        <h3 className={styles.tableTitle}>Activity History</h3>
        
        <div className={styles.filterGroup}>
          <label htmlFor="catFilter" className={styles.filterLabel}>
            Filter Category:
          </label>
          <select
            id="catFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className={styles.responsiveContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">
                <button
                  onClick={() => handleSort('date')}
                  className={styles.sortHeaderButton}
                  aria-label="Sort by Date"
                >
                  Date {sortField === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col">
                <button
                  onClick={() => handleSort('category')}
                  className={styles.sortHeaderButton}
                  aria-label="Sort by Category"
                >
                  Category {sortField === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col">Sub-Category</th>
              <th scope="col">
                <button
                  onClick={() => handleSort('amount')}
                  className={styles.sortHeaderButton}
                  aria-label="Sort by Amount"
                >
                  Amount {sortField === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col">
                <button
                  onClick={() => handleSort('co2Amount')}
                  className={styles.sortHeaderButton}
                  aria-label="Sort by Carbon Emissions"
                >
                  CO₂ (kg) {sortField === 'co2Amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col">Notes</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedActivities.length > 0 ? (
              processedActivities.map((act) => {
                const meta = CATEGORY_META[act.category as Category];
                const ef = getEmissionFactor(act.subCategory);

                return (
                  <tr key={act.id} className={act.isAnomaly ? styles.anomalyRow : undefined}>
                    <td>{formatDate(act.date)}</td>
                    <td>
                      <span className={styles.categoryCell}>
                        <span className={styles.catIcon} aria-hidden="true" style={{ color: meta?.color }}>
                          {meta?.icon ?? '📊'}
                        </span>
                        {meta?.label ?? act.category}
                      </span>
                    </td>
                    <td>{ef?.displayName ?? act.subCategory}</td>
                    <td>
                      {act.amount} <span className={styles.unitLabel}>{act.unit}</span>
                    </td>
                    <td className={styles.co2Cell}>
                      <span className={styles.co2Value}>{act.co2Amount.toFixed(1)}</span>
                      {act.isAnomaly && (
                        <span className={styles.anomalyBadge} title="Unusual carbon spike detected by AI">
                          ⚠️ Spike
                        </span>
                      )}
                    </td>
                    <td className={styles.notesCell}>{act.notes || '—'}</td>
                    <td>
                      <button
                        onClick={() => setDeleteId(act.id)}
                        className={styles.deleteButton}
                        aria-label={`Delete activity from ${formatDate(act.date)}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  No activities logged for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className={styles.modalBody}>
          <p>Are you sure you want to delete this activity log? This action cannot be undone.</p>
          <div className={styles.modalActions}>
            <Button
              variant="ghost"
              onClick={() => setDeleteId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={isPending}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
