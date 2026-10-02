import { render, screen } from '@testing-library/react';
import LoginPage from './page';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock('@/app/actions/auth', () => ({
  login: vi.fn(),
}));

describe('LoginPage', () => {
  it('shows the recommended demo account and pre-fills the credentials', () => {
    render(<LoginPage />);

    expect(screen.getByText(/recommended demo account/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(emailInput.value).toBe('demo@carbonwise.com');
    expect(passwordInput.value).toBe('password123');
  });
});
