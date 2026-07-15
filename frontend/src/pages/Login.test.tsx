import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import * as api from '../lib/api';
import * as auth from '../lib/auth';

// Mock dependencies
vi.mock('../lib/api', () => ({
  login: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.useAuth as any).mockReturnValue({
      user: null,
      refresh: vi.fn().mockResolvedValue(undefined),
    });
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    renderLogin();
    const button = screen.getByRole('button', { name: /Sign In/i });
    
    // HTML5 validation will prevent submission, but if we bypass it:
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toBeRequired();
  });

  it('calls login api and navigates on success', async () => {
    const mockLogin = vi.mocked(api.login).mockResolvedValue({ token: 'fake-token', user: {} as any });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'password123');
    
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'wrong');
    
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
