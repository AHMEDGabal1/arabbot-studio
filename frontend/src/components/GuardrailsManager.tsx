import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  Ban,
  RefreshCw,
  Edit3,
  X,
  Check,
  Zap,
  Tag,
  Power,
  ShieldCheck,
  Maximize2,
  FileCode2,
} from 'lucide-react';
import {
  listGuardrails,
  createGuardrail,
  updateGuardrail,
  deleteGuardrail,
} from '../lib/api';
import type { GuardrailRule, GuardrailRuleCreate } from '../types';

interface Props {
  botId: string;
}

const RULE_TYPE_OPTIONS = [
  {
    value: 'forbidden_word',
    label: 'Forbidden Word (كلمة محظورة)',
    description: 'Triggers when specific forbidden keywords are detected',
    icon: Ban,
  },
  {
    value: 'max_discount',
    label: 'Max Discount % (الحد الأقصى للخصم %)',
    description: 'Enforces maximum allowed discount percentage offered by AI',
    icon: Tag,
  },
  {
    value: 'required_phrase',
    label: 'Required Phrase (عبارة إلزامية)',
    description: 'Ensures specific terms or disclaimers are present',
    icon: CheckCircle2,
  },
  {
    value: 'regex_block',
    label: 'Regex Pattern (نمط تعبير نمطي)',
    description: 'Matches complex string patterns like phone numbers, emails, cards',
    icon: FileCode2,
  },
  {
    value: 'max_length',
    label: 'Max Character Length (الحد الأقصى لطول النص)',
    description: 'Limits response length to prevent rambling',
    icon: Maximize2,
  },
] as const;

const ACTION_OPTIONS = [
  {
    value: 'block',
    label: 'Block (حظر الرد)',
    description: 'Reject response and output fallback message',
    badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  {
    value: 'replace',
    label: 'Replace (استبدال النص)',
    description: 'Swap matched text with custom replacement',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    value: 'flag',
    label: 'Flag (تسجيل وتحذير)',
    description: 'Log warning without modifying response',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    value: 'escalate',
    label: 'Escalate (تحويل بشري)',
    description: 'Trigger immediate handoff to human support agent',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
] as const;

const PRESET_RULES: Array<{
  name: string;
  nameAr: string;
  desc: string;
  data: GuardrailRuleCreate;
}> = [
  {
    name: 'Block 50%+ Discount',
    nameAr: 'حظر الخصم أكثر من 50%',
    desc: 'Prevent AI from promising discounts over 50%',
    data: {
      rule_type: 'max_discount',
      value: '50',
      action: 'block',
      priority: 1,
      is_active: true,
    },
  },
  {
    name: 'Block Phone Numbers',
    nameAr: 'حظر أرقام الهواتف',
    desc: 'Block responses containing phone numbers',
    data: {
      rule_type: 'regex_block',
      value: '(\\+?\\d{1,4}[\\s-]?)?\\(?\\d{1,4}\\)?[\\s-]?\\d{3,4}[\\s-]?\\d{3,4}',
      action: 'block',
      priority: 2,
      is_active: true,
    },
  },
  {
    name: 'Require Terms Disclaimer',
    nameAr: 'إلزامية ذكر الشروط والأحكام',
    desc: 'Append mandatory legal disclaimers',
    data: {
      rule_type: 'required_phrase',
      value: 'تطبق الشروط والأحكام',
      action: 'replace',
      replacement_text: '*تطبق الشروط والأحكام الخاصة بالمؤسسة*',
      priority: 3,
      is_active: true,
    },
  },
  {
    name: 'Block Abusive Words',
    nameAr: 'حظر الكلمات النسيئة والتطاول',
    desc: 'Escalate to agent if inappropriate language is detected',
    data: {
      rule_type: 'forbidden_word',
      value: 'احتيال,نصب,سرقة,غش',
      action: 'escalate',
      priority: 1,
      is_active: true,
    },
  },
];

export default function GuardrailsManager({ botId }: Props) {
  const [rules, setRules] = useState<GuardrailRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GuardrailRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [presetLoading, setPresetLoading] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    rule_type: 'forbidden_word' | 'max_discount' | 'required_phrase' | 'regex_block' | 'max_length';
    value: string;
    action: 'block' | 'replace' | 'flag' | 'escalate';
    replacement_text: string;
    priority: number;
    is_active: boolean;
  }>({
    rule_type: 'forbidden_word',
    value: '',
    action: 'block',
    replacement_text: '',
    priority: 1,
    is_active: true,
  });

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const data = await listGuardrails(botId);
        // Sort by priority ascending
        const sorted = Array.isArray(data) ? [...data].sort((a, b) => a.priority - b.priority) : [];
        setRules(sorted);
      } catch (err: unknown) {
        console.error(err);
        toast.error('Failed to load safety guardrails');
      } finally {
        setLoading(false);
      }
    };

    if (botId) {
      fetchRules();
    }
  }, [botId]);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      rule_type: 'forbidden_word',
      value: '',
      action: 'block',
      replacement_text: '',
      priority: rules.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: GuardrailRule) => {
    setEditingRule(rule);
    setFormData({
      rule_type: rule.rule_type,
      value: rule.value,
      action: rule.action,
      replacement_text: rule.replacement_text || '',
      priority: rule.priority || 1,
      is_active: rule.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.value.trim()) {
      toast.error('Please enter a rule value');
      return;
    }

    try {
      setSaving(true);
      const payload: GuardrailRuleCreate = {
        rule_type: formData.rule_type,
        value: formData.value.trim(),
        action: formData.action,
        replacement_text: formData.action === 'replace' ? formData.replacement_text : undefined,
        priority: formData.priority,
        is_active: formData.is_active,
      };

      if (editingRule) {
        await updateGuardrail(botId, editingRule.id, payload);
        toast.success('Guardrail rule updated!');
      } else {
        await createGuardrail(botId, payload);
        toast.success('Guardrail rule added!');
      }
      setIsModalOpen(false);
      await fetchRules();
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err && typeof err === 'object' && 'response' in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === 'string'
        ? (err as { response: { data: { detail: string } } }).response.data.detail
        : 'Failed to save guardrail rule';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule: GuardrailRule) => {
    try {
      const updatedStatus = !rule.is_active;
      // Optimistic update
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: updatedStatus } : r))
      );
      await updateGuardrail(botId, rule.id, { is_active: updatedStatus });
      toast.success(updatedStatus ? 'Rule activated' : 'Rule deactivated');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to update rule status');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      setDeletingId(ruleId);
      await deleteGuardrail(botId, ruleId);
      toast.success('Guardrail rule deleted');
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to delete guardrail rule');
    } finally {
      setDeletingId(null);
    }
  };

  const handleApplyPreset = async (preset: typeof PRESET_RULES[0]) => {
    try {
      setPresetLoading(preset.name);
      await createGuardrail(botId, preset.data);
      toast.success(`Preset "${preset.name}" applied successfully!`);
      await fetchRules();
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err && typeof err === 'object' && 'response' in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === 'string'
        ? (err as { response: { data: { detail: string } } }).response.data.detail
        : 'Failed to apply preset';
      toast.error(errorMsg);
    } finally {
      setPresetLoading(null);
    }
  };

  const getRuleTypeBadge = (type: GuardrailRule['rule_type']) => {
    switch (type) {
      case 'forbidden_word':
        return { label: 'Forbidden Word', labelAr: 'كلمة محظورة', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'max_discount':
        return { label: 'Max Discount %', labelAr: 'حد الخصم %', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'required_phrase':
        return { label: 'Required Phrase', labelAr: 'عبارة إلزامية', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'regex_block':
        return { label: 'Regex Pattern', labelAr: 'نمط تعبيري', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'max_length':
        return { label: 'Max Length', labelAr: 'الحد الأقصى للطول', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      default:
        return { label: type, labelAr: type, color: 'bg-sand-100 text-navy-800 border-sand-300' };
    }
  };

  const getActionBadge = (action: GuardrailRule['action']) => {
    const matched = ACTION_OPTIONS.find((a) => a.value === action);
    return matched ? matched.badgeClass : 'bg-sand-100 text-navy-800 border-sand-300';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-6 bg-white/80 backdrop-blur-md border-sand-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-500/10 flex items-center justify-center border border-terracotta-500/20 text-terracotta-500 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-navy-900">Safety & Guardrail Rules</h2>
                <span className="text-xs font-arabic text-ash-400 font-normal" dir="rtl">
                  (قواعد الأمان والحماية)
                </span>
              </div>
              <p className="text-xs text-ash-400 mt-0.5">
                Define strict boundary rules for bot responses, discount caps, forbidden words, and automated handoffs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchRules}
              disabled={loading}
              className="p-2.5 text-ash-400 hover:text-navy-900 hover:bg-sand-100 rounded-xl transition-colors border border-sand-200"
              title="Refresh rules"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="btn btn-primary px-4 py-2.5 text-xs font-bold gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Guardrail Rule
            </button>
          </div>
        </div>

        {/* Presets Section */}
        <div className="mt-6 pt-5 border-t border-sand-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-navy-900">Quick Safety Presets</span>
              <span className="text-[11px] text-ash-400 font-arabic" dir="rtl">(قوالب حماية جاهزة)</span>
            </div>
            <span className="text-[11px] text-terracotta-600 font-semibold">1-Click Apply</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_RULES.map((preset) => {
              const isApplying = presetLoading === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  disabled={isApplying || loading}
                  className="p-3 bg-sand-50/80 hover:bg-terracotta-50/60 hover:border-terracotta-200 border border-sand-200 rounded-2xl text-left transition-all duration-150 group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy-900 group-hover:text-terracotta-600 transition-colors">
                        {preset.name}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-ash-400 group-hover:text-terracotta-500 transition-transform group-hover:rotate-90" />
                    </div>
                    <p className="text-[11px] font-arabic text-navy-700/80 mt-0.5" dir="rtl">
                      {preset.nameAr}
                    </p>
                    <p className="text-[11px] text-ash-400 mt-1 line-clamp-1">{preset.desc}</p>
                  </div>
                  {isApplying && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-terracotta-500 animate-spin" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Rules List */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3 bg-white/80 border-sand-200">
          <div className="w-8 h-8 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-ash-400">Loading safety guardrails...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="card p-12 text-center bg-white/80 border-sand-200 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-sand-100 flex items-center justify-center mx-auto text-ash-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-navy-900">No Guardrail Rules Configured</h3>
            <p className="text-xs text-ash-400 max-w-md mx-auto mt-1">
              Guardrail rules protect your business by restricting unauthorized discounts, filtering inappropriate content, and forcing mandatory compliance text.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary px-5 py-2.5 text-xs font-bold gap-2 inline-flex"
          >
            <Plus className="w-4 h-4" />
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {rules.map((rule) => {
              const typeInfo = getRuleTypeBadge(rule.rule_type);
              const actionBadge = getActionBadge(rule.action);
              const isDeleting = deletingId === rule.id;

              return (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`card p-5 bg-white/90 border transition-all duration-200 ${
                    rule.is_active ? 'border-sand-200 hover:border-terracotta-200' : 'border-sand-200/60 opacity-60 bg-sand-50/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Main Content Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          className={`p-2 rounded-xl border transition-colors ${
                            rule.is_active
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-sand-100 text-ash-400 border-sand-200 hover:bg-sand-200'
                          }`}
                          title={rule.is_active ? 'Deactivate rule' : 'Activate rule'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Priority Badge */}
                          <span className="px-2 py-0.5 rounded-md bg-navy-900 text-white font-mono text-[10px] font-bold">
                            Priority #{rule.priority}
                          </span>

                          {/* Rule Type Badge */}
                          <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>

                          {/* Action Badge */}
                          <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold capitalize ${actionBadge}`}>
                            Action: {rule.action}
                          </span>
                        </div>

                        {/* Value & Replacement Display */}
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-ash-400 font-medium">Trigger Value:</span>
                            <code className="text-xs font-mono font-bold text-navy-900 bg-sand-100 px-2 py-0.5 rounded border border-sand-200 break-all">
                              {rule.value}
                            </code>
                          </div>

                          {rule.action === 'replace' && rule.replacement_text && (
                            <div className="flex items-baseline gap-2 text-xs">
                              <span className="text-ash-400 font-medium">Replacement:</span>
                              <span className="font-arabic font-semibold text-terracotta-600 bg-terracotta-50 px-2 py-0.5 rounded border border-terracotta-200/50" dir="auto">
                                "{rule.replacement_text}"
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Right */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-sand-100 justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rule)}
                        className="p-2 text-ash-400 hover:text-navy-900 hover:bg-sand-100 rounded-xl transition-colors border border-sand-200"
                        title="Edit rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        disabled={isDeleting}
                        className="p-2 text-ash-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-sand-200"
                        title="Delete rule"
                      >
                        {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Form for Create / Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-sand-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-sand-200 bg-sand-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-500/10 flex items-center justify-center text-terracotta-500">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-navy-900">
                      {editingRule ? 'Edit Guardrail Rule' : 'Create Guardrail Rule'}
                    </h3>
                    <p className="text-xs text-ash-400 font-arabic" dir="rtl">
                      {editingRule ? 'تعديل قاعدة الأمان والحماية' : 'إضافة قاعدة أمان جديدة للبوت'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-ash-400 hover:text-navy-900 rounded-xl hover:bg-sand-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Rule Type Selector */}
                <div>
                  <label htmlFor="rule-type-select" className="block font-body text-xs font-bold text-navy-900 mb-1.5 uppercase tracking-wider">
                    Rule Type <span className="font-arabic text-ash-400 font-normal lowercase">(نوع القاعدة)</span>
                  </label>
                  <div className="space-y-2">
                    {RULE_TYPE_OPTIONS.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.rule_type === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, rule_type: type.value as 'forbidden_word' | 'max_discount' | 'required_phrase' | 'regex_block' | 'max_length' }))}
                          className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                            isSelected
                              ? 'bg-terracotta-50/50 border-terracotta-300 ring-1 ring-terracotta-400'
                              : 'bg-white border-sand-200 hover:border-sand-300'
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-terracotta-500 text-white' : 'bg-sand-100 text-ash-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-navy-900">{type.label}</span>
                              {isSelected && <Check className="w-4 h-4 text-terracotta-500" />}
                            </div>
                            <p className="text-[11px] text-ash-400 mt-0.5">{type.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rule Value Input */}
                <div>
                  <label htmlFor="rule-value" className="block font-body text-xs font-bold text-navy-900 mb-1.5 uppercase tracking-wider">
                    Target Value / Pattern <span className="font-arabic text-ash-400 font-normal lowercase">(قيمة القاعدة)</span>
                  </label>
                  <input
                    id="rule-value"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData((f) => ({ ...f, value: e.target.value }))}
                    className="input font-mono text-sm"
                    placeholder={
                      formData.rule_type === 'max_discount'
                        ? 'e.g. 50'
                        : formData.rule_type === 'forbidden_word'
                        ? 'e.g. خصم غير مصرح,احتيال'
                        : formData.rule_type === 'required_phrase'
                        ? 'e.g. تطبق الشروط والأحكام'
                        : 'e.g. Regex or String value'
                    }
                  />
                  <p className="text-[11px] text-ash-400 mt-1">
                    {formData.rule_type === 'max_discount' && 'Numeric percentage limit (e.g. 50 means max 50% discount).'}
                    {formData.rule_type === 'forbidden_word' && 'Comma-separated words or single word.'}
                    {formData.rule_type === 'regex_block' && 'Standard regular expression syntax.'}
                  </p>
                </div>

                {/* Action Selector */}
                <div>
                  <label htmlFor="rule-action-select" className="block font-body text-xs font-bold text-navy-900 mb-1.5 uppercase tracking-wider">
                    Enforcement Action <span className="font-arabic text-ash-400 font-normal lowercase">(الإجراء المتخذ)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTION_OPTIONS.map((action) => {
                      const isSelected = formData.action === action.value;
                      return (
                        <button
                          key={action.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, action: action.value as 'block' | 'replace' | 'flag' | 'escalate' }))}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                              : 'bg-sand-50/60 border-sand-200 text-navy-900 hover:bg-sand-100'
                          }`}
                        >
                          <span className="text-xs font-bold block">{action.label}</span>
                          <span className={`text-[10px] mt-0.5 block ${isSelected ? 'text-sand-300' : 'text-ash-400'}`}>
                            {action.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Replacement Text (Conditional) */}
                {formData.action === 'replace' && (
                  <div>
                    <label htmlFor="rule-replacement-text" className="block font-body text-xs font-bold text-navy-900 mb-1.5 uppercase tracking-wider">
                      Replacement Text <span className="font-arabic text-ash-400 font-normal lowercase">(نص الاستبدال)</span>
                    </label>
                    <input
                      id="rule-replacement-text"
                      value={formData.replacement_text}
                      onChange={(e) => setFormData((f) => ({ ...f, replacement_text: e.target.value }))}
                      className="input font-arabic text-sm"
                      placeholder="e.g. *تطبق الشروط والأحكام*"
                      dir="auto"
                    />
                  </div>
                )}

                {/* Priority & Active Status */}
                <div className="grid grid-cols-2 gap-4 items-center pt-2">
                  <div>
                    <label htmlFor="rule-priority" className="block font-body text-xs font-bold text-navy-900 mb-1.5 uppercase tracking-wider">
                      Priority Order
                    </label>
                    <input
                      id="rule-priority"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.priority}
                      onChange={(e) => setFormData((f) => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                      className="input"
                    />
                    <p className="text-[10px] text-ash-400 mt-1">Lower number = evaluated first.</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-sand-50 rounded-2xl border border-sand-200 mt-5">
                    <span className="text-xs font-bold text-navy-900">Active Rule</span>
                    <input
                      type="checkbox"
                      id="rule-active-toggle"
                      checked={formData.is_active}
                      onChange={(e) => setFormData((f) => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 text-terracotta-500 rounded focus:ring-terracotta-400"
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-sand-200">
                  <button type="submit" disabled={saving} className="btn btn-primary px-6 py-2.5 font-bold flex-1">
                    {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Guardrail'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary px-5 py-2.5"
                  >
                    Cancel
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
