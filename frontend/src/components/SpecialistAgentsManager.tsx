import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Bot,
  Tag,
  Sliders,
  FileText,
  RefreshCw,
} from 'lucide-react';
import {
  listAgents,
  createAgentConfig,
  updateAgentConfig,
  deleteAgentConfig,
  seedDefaultAgents,
} from '../lib/api';
import type { AgentConfig, AgentConfigCreate } from '../types';

interface Props {
  botId: string;
}

const AGENT_TYPE_OPTIONS = [
  { value: 'sales', label: 'Sales Agent (مبيعات)' },
  { value: 'support', label: 'Technical Support (دعم فني)' },
  { value: 'faq', label: 'FAQ & Inquiry (أسئلة شائعة)' },
  { value: 'complaints', label: 'Complaints & Handoff (شكاوى)' },
  { value: 'custom', label: 'Custom Agent (مخصص)' },
];

export default function SpecialistAgentsManager({ botId }: Props) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    display_name: string;
    agent_type: string;
    system_prompt: string;
    handles_intents: string;
    model_provider: string;
    model_name: string;
    temperature: number;
    is_active: boolean;
  }>({
    display_name: '',
    agent_type: 'sales',
    system_prompt: '',
    handles_intents: '',
    model_provider: 'gemini',
    model_name: 'gemini-1.5-flash',
    temperature: 0.7,
    is_active: true,
  });

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await listAgents(botId);
      setAgents(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load specialist agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (botId) {
      fetchAgents();
    }
  }, [botId]);

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      const seeded = await seedDefaultAgents(botId);
      toast.success(`Seeded ${seeded.length} default Egyptian agents!`);
      await fetchAgents();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to seed default agents');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setEditingAgent(null);
    setFormData({
      display_name: '',
      agent_type: 'sales',
      system_prompt: 'أنت مساعد المبيعات المتخصص. تجيب عن أسئلة العميل حول الأسعار والمنتجات والعروض بالعامية المصرية الودودة.',
      handles_intents: 'sales, pricing, product_info',
      model_provider: 'gemini',
      model_name: 'gemini-1.5-flash',
      temperature: 0.7,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (agent: AgentConfig) => {
    setEditingAgent(agent);
    let parsedIntents = agent.handles_intents;
    try {
      const arr = JSON.parse(agent.handles_intents);
      if (Array.isArray(arr)) {
        parsedIntents = arr.join(', ');
      }
    } catch {
      // keep raw if not JSON
    }

    setFormData({
      display_name: agent.display_name,
      agent_type: agent.agent_type,
      system_prompt: agent.system_prompt,
      handles_intents: parsedIntents,
      model_provider: agent.model_provider || 'gemini',
      model_name: agent.model_name || 'gemini-1.5-flash',
      temperature: agent.temperature ?? 0.7,
      is_active: agent.is_active,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (agent: AgentConfig) => {
    const updatedStatus = !agent.is_active;
    // Optimistic UI update
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, is_active: updatedStatus } : a))
    );

    try {
      await updateAgentConfig(botId, agent.id, { is_active: updatedStatus });
      toast.success(`${agent.display_name} ${updatedStatus ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update agent status');
      // Revert optimism
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, is_active: agent.is_active } : a))
      );
    }
  };

  const handleDelete = async (agentId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to delete "${displayName}"?`)) return;
    setDeletingId(agentId);
    try {
      await deleteAgentConfig(botId, agentId);
      toast.success('Agent deleted successfully');
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete agent');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Format handles_intents as a JSON array string
    const intentsArray = formData.handles_intents
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const jsonIntents = JSON.stringify(intentsArray);

    const payload: AgentConfigCreate = {
      display_name: formData.display_name,
      agent_type: formData.agent_type,
      system_prompt: formData.system_prompt,
      handles_intents: jsonIntents,
      model_provider: formData.model_provider,
      model_name: formData.model_name,
      temperature: Number(formData.temperature),
      is_active: formData.is_active,
    };

    try {
      if (editingAgent) {
        const updated = await updateAgentConfig(botId, editingAgent.id, payload);
        toast.success('Agent config updated successfully!');
        setAgents((prev) => prev.map((a) => (a.id === editingAgent.id ? updated : a)));
      } else {
        const created = await createAgentConfig(botId, payload);
        toast.success('Specialist Agent created successfully!');
        setAgents((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save agent configuration');
    } finally {
      setSaving(false);
    }
  };

  const parseIntents = (raw: string): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [raw];
  };

  const getAgentBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sales':
        return { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400', label: 'Sales Agent' };
      case 'support':
        return { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400', label: 'Tech Support' };
      case 'faq':
        return { bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400', label: 'FAQ Agent' };
      case 'complaints':
        return { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400', label: 'Complaints Agent' };
      default:
        return { bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400', label: type.toUpperCase() };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Specialist Sub-Agents</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-agent routing for intent-based specialization (Sales, Support, Complaints, FAQs).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 rounded-xl transition-all disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
            <span>Seed Egyptian Defaults</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Agent</span>
          </button>
        </div>
      </div>

      {/* Agents List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Bot className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Specialist Agents Configured</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Create specialized sub-agents to handle sales inquiries, customer complaints, or tech support with custom prompts.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 rounded-xl transition-all"
            >
              Seed Built-in Egyptian Agents
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
            >
              Create First Agent
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {agents.map((agent) => {
              const badgeStyle = getAgentBadgeStyle(agent.agent_type);
              const intents = parseIntents(agent.handles_intents);
              const isPromptExpanded = expandedPromptId === agent.id;

              return (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 ${
                    agent.is_active
                      ? 'border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-950/50'
                  }`}
                >
                  <div>
                    {/* Top Row: Title, Badge & Active Switch */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {agent.display_name}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeStyle.bg}`}
                          >
                            {badgeStyle.label}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          {agent.model_provider || 'gemini'} / {agent.model_name || 'gemini-1.5-flash'}
                        </p>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => handleToggleActive(agent)}
                        title={agent.is_active ? 'Deactivate Agent' : 'Activate Agent'}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          agent.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            agent.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* System Prompt snippet */}
                    <div className="mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> System Prompt
                        </span>
                        <button
                          onClick={() => setExpandedPromptId(isPromptExpanded ? null : agent.id)}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold cursor-pointer"
                        >
                          {isPromptExpanded ? 'Show less' : 'View full'}
                        </button>
                      </div>
                      <p
                        className={`text-xs text-slate-700 dark:text-slate-300 font-arabic leading-relaxed ${
                          isPromptExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                        }`}
                        dir="rtl"
                      >
                        {agent.system_prompt}
                      </p>
                    </div>

                    {/* Intents handled */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        <Tag className="w-3.5 h-3.5" /> Handled Intents
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {intents.length > 0 ? (
                          intents.map((intent, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700"
                            >
                              {intent}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No specific intent restriction</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Metadata & Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1" title="Temperature">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        Temp: <strong className="text-slate-700 dark:text-slate-200">{agent.temperature}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(agent)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Agent"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id, agent.display_name)}
                        disabled={deletingId === agent.id}
                        className="p-1.5 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Agent"
                      >
                        {deletingId === agent.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal for Add / Edit Agent Config */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {editingAgent ? 'Edit Specialist Agent' : 'Create Specialist Agent'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="e.g. Sales Specialist (مسئول المبيعات)"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Agent Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Agent Type *
                    </label>
                    <select
                      value={formData.agent_type}
                      onChange={(e) => setFormData({ ...formData, agent_type: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {AGENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Handled Intents */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Handled Intents (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.handles_intents}
                    onChange={(e) => setFormData({ ...formData, handles_intents: e.target.value })}
                    placeholder="e.g. sales, pricing, buy_request"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    When the intent classifier detects one of these intents, execution routes to this agent.
                  </p>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Prompt (Instructions & Dialect) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    placeholder="أنت مساعد المبيعات الذكي..."
                    dir="rtl"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-arabic leading-relaxed"
                  />
                </div>

                {/* LLM Provider, Model & Temperature */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Provider
                    </label>
                    <select
                      value={formData.model_provider}
                      onChange={(e) => setFormData({ ...formData, model_provider: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={formData.model_name}
                      onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                      placeholder="gemini-1.5-flash"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Temperature: {formData.temperature}
                      </label>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 mt-2"
                    />
                  </div>
                </div>

                {/* Is Active Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_check"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active_check" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Enable this agent immediately upon saving
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>{editingAgent ? 'Save Changes' : 'Create Agent'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
