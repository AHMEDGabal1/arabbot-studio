import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Register from './Register';

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../lib/api', () => ({
  register: vi.fn().mockResolvedValue({ access_token: 'fake_token', user_id: '123' }),
}));

describe('Register Component', () => {
  it('renders registration form correctly', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('calls register API on submit', async () => {
    const { register } = await import('../lib/api');

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('newuser@example.com', 'password123', 'New User', undefined);
    });
  });
});
