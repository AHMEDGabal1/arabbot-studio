import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import KnowledgeBase from './KnowledgeBase';
import * as api from '../lib/api';

vi.mock('../lib/api', () => ({
  getBot: vi.fn(),
  listKnowledge: vi.fn(),
  createKnowledge: vi.fn(),
  deleteKnowledge: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ botId: 'bot-123' }),
  };
});

describe('KnowledgeBase Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <KnowledgeBase />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(api.getBot).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.listKnowledge).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state when no items exist', async () => {
    vi.mocked(api.getBot).mockResolvedValue({ id: 'bot-123', name: 'Test Bot', channel: 'whatsapp', is_active: true, language: 'en', workspace_id: 'ws', created_at: '', updated_at: '' });
    vi.mocked(api.listKnowledge).mockResolvedValue([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Knowledge items for Test Bot')).toBeInTheDocument();
      expect(screen.getByText('No knowledge items yet')).toBeInTheDocument();
    });
  });

  it('adds a new knowledge item', async () => {
    vi.mocked(api.getBot).mockResolvedValue({ id: 'bot-123', name: 'Test Bot', channel: 'whatsapp', is_active: true, language: 'en', workspace_id: 'ws', created_at: '', updated_at: '' });
    vi.mocked(api.listKnowledge).mockResolvedValue([]);
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Add Item/i }));

    const questionInput = screen.getByLabelText(/Question/i);
    const answerInput = screen.getByLabelText(/Answer/i);

    await user.type(questionInput, 'What is this?');
    await user.type(answerInput, 'This is a test answer.');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(api.createKnowledge).toHaveBeenCalledWith('bot-123', { question: 'What is this?', answer: 'This is a test answer.' });
  });

  it('displays knowledge items and allows deletion', async () => {
    vi.mocked(api.getBot).mockResolvedValue({ id: 'bot-123', name: 'Test Bot', channel: 'whatsapp', is_active: true, language: 'en', workspace_id: 'ws', created_at: '', updated_at: '' });
    vi.mocked(api.listKnowledge).mockResolvedValue([
      { id: 'item-1', bot_id: 'bot-123', type: 'text', question: 'Q1', answer: 'A1', created_at: '2023-01-01', updated_at: '2023-01-01' }
    ]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);
    
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Q: Q1')).toBeInTheDocument();
      expect(screen.getByText('A1')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /Delete knowledge item/i });
    await user.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(api.deleteKnowledge).toHaveBeenCalledWith('bot-123', 'item-1');
    confirmSpy.mockRestore();
  });
});
