import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import BotsList from './BotsList';
import * as api from '../lib/api';

// Mock API
vi.mock('../lib/api', () => ({
  listBots: vi.fn(),
  deleteBot: vi.fn(),
  activateBot: vi.fn(),
  deactivateBot: vi.fn(),
}));

describe('BotsList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BotsList />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(api.listBots).mockReturnValue(new Promise(() => {})); // pending promise
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state when no bots exist', async () => {
    vi.mocked(api.listBots).mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No bots yet')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Create Bot/i })).toBeInTheDocument();
  });

  it('renders a list of bots', async () => {
    vi.mocked(api.listBots).mockResolvedValue([
      { id: '1', name: 'Sales Bot', channel: 'whatsapp', is_active: true, language: 'ar', workspace_id: 'ws1', created_at: '', updated_at: '' },
      { id: '2', name: 'Support Bot', channel: 'whatsapp', is_active: false, language: 'en', workspace_id: 'ws1', created_at: '', updated_at: '' },
    ]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sales Bot')).toBeInTheDocument();
      expect(screen.getByText('Support Bot')).toBeInTheDocument();
    });
    
    // Check statuses
    const activeBadges = screen.getAllByText('Active');
    const inactiveBadges = screen.getAllByText('Inactive');
    expect(activeBadges).toHaveLength(1);
    expect(inactiveBadges).toHaveLength(1);
  });

  it('calls delete API when delete button is clicked', async () => {
    vi.mocked(api.listBots).mockResolvedValue([
      { id: '1', name: 'Delete Me', channel: 'whatsapp', is_active: true, language: 'ar', workspace_id: 'ws1', created_at: '', updated_at: '' },
    ]);
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);
    
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete bot/i });
    await user.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(api.deleteBot).toHaveBeenCalledWith('1');
    
    confirmSpy.mockRestore();
  });
});
