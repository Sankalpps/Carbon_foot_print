import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ActivityTable from '../ActivityTable';

// Mock removeActivity server action
vi.mock('@/app/actions/activities', () => ({
  removeActivity: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock useToast hook
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

const mockActivities = [
  {
    id: '1',
    category: 'transport',
    subCategory: 'car_petrol',
    amount: 15,
    unit: 'km',
    co2Amount: 3.15,
    date: '2025-06-01T00:00:00.000Z',
    isAnomaly: false,
    notes: 'Commute to work',
  },
  {
    id: '2',
    category: 'food',
    subCategory: 'beef',
    amount: 0.5,
    unit: 'kg',
    co2Amount: 13.5,
    date: '2025-06-02T00:00:00.000Z',
    isAnomaly: true,
    notes: 'Steak dinner',
  },
];

describe('ActivityTable Component', () => {
  it('renders activities correctly in the table', () => {
    render(<ActivityTable activities={mockActivities} />);
    expect(screen.getByText('Commute to work')).toBeInTheDocument();
    expect(screen.getByText('Steak dinner')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('km')).toBeInTheDocument();
    expect(screen.getByText('3.1')).toBeInTheDocument();
  });

  it('renders empty state when no activities are provided', () => {
    render(<ActivityTable activities={[]} />);
    expect(screen.getByText(/No activities logged/i)).toBeInTheDocument();
  });

  it('filters activities by category select dropdown', () => {
    render(<ActivityTable activities={mockActivities} />);
    const select = screen.getByRole('combobox');
    
    // Select food category
    fireEvent.change(select, { target: { value: 'food' } });
    
    expect(screen.queryByText('Commute to work')).not.toBeInTheDocument();
    expect(screen.getByText('Steak dinner')).toBeInTheDocument();
  });
});
