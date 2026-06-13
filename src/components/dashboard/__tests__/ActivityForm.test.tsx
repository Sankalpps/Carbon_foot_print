import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ActivityForm from '../ActivityForm';

// Mock server action
vi.mock('@/app/actions/activities', () => ({
  addActivity: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock useToast hook
const mockAddToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

describe('ActivityForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all categories and inputs correctly', () => {
    render(<ActivityForm />);
    expect(screen.getByText('Log New Activity')).toBeInTheDocument();
    expect(screen.getByText('Choose Category')).toBeInTheDocument();
    expect(screen.getByLabelText(/Sub-Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
  });

  it('calculates carbon preview when amount is entered', async () => {
    render(<ActivityForm />);
    const amountInput = screen.getByLabelText(/Amount/i);
    
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    // Check if estimated emissions text is displayed
    await waitFor(() => {
      expect(screen.getByText(/Estimated Emissions:/i)).toBeInTheDocument();
    });
  });
});
