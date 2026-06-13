import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StatCard from '../StatCard';

describe('StatCard Component', () => {
  it('renders title and value correctly', () => {
    render(<StatCard title="Test Metric" value="123.45" />);
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('123.45')).toBeInTheDocument();
  });

  it('renders unit when provided', () => {
    render(<StatCard title="Test Metric" value="123.45" unit="kg CO2" />);
    expect(screen.getByText('kg CO2')).toBeInTheDocument();
  });

  it('renders trend indicators correctly', () => {
    const { rerender } = render(
      <StatCard title="Test" value="10" trend={{ direction: 'up', value: '15%' }} />
    );
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('▲')).toBeInTheDocument();

    rerender(<StatCard title="Test" value="10" trend={{ direction: 'down', value: '8%' }} />);
    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByText('▼')).toBeInTheDocument();

    rerender(<StatCard title="Test" value="10" trend={{ direction: 'neutral', value: '0%' }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatCard title="Test" value="10" icon={<span data-testid="test-icon">🌱</span>} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
