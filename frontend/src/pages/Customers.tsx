import { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Tag, 
  MessageSquare, 
  Clock, 
  X, 
  Plus, 
  Save, 
  Award, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  MessageCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listCustomers, getCustomerConversations, updateCustomer } from '../lib/api';
import type { CustomerProfile, Conversation } from '../types';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';

function parseTags(tagsStr?: string | null): string[] {
  if (!tagsStr) return [];
  try {
    const parsed = JSON.parse(tagsStr);
    if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
  } catch {
    // Fall back to comma-separated
  }
  return tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
}

function getTagBadgeClass(tag: string): string {
  const normalized = tag.toLowerCase();
  if (normalized === 'vip' || normalized === 'premium') {
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  }
  if (normalized === 'returning' || normalized === 'loyal') {
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  }
  if (normalized === 'complaint' || normalized === 'high_risk' || normalized === 'churn_risk') {
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  }
  if (normalized === 'lead' || normalized === 'prospect') {
    return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  }
  return 'bg-terracotta-500/10 text-terracotta-700 border-terracotta-500/20';
}

const PREDEFINED_TAGS = ['vip', 'returning', 'complaint', 'lead', 'high_value'];

const LANGUAGES = [
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'de', name: 'German (Deutsch)' },
];

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Selected customer for Slide-over Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerConversations, setCustomerConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing customer details
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPreferredLanguage, setEditPreferredLanguage] = useState('ar');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: { q?: string; tag?: string } = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (tagFilter) params.tag = tagFilter;

      const data = await listCustomers(params);
      setCustomers(data);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
      toast.error('Failed to load customer profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tagFilter]);

  // Handle debounced search execution
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Drawer and initialize edit form
  const handleOpenDrawer = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setEditDisplayName(customer.display_name || '');
    setEditPhone(customer.phone || '');
    setEditEmail(customer.email || '');
    setEditPreferredLanguage(customer.preferred_language || 'ar');
    setEditNotes(customer.notes || '');
    setEditTags(parseTags(customer.tags));
    setNewTagInput('');

    // Fetch conversation history
    setConversationsLoading(true);
    try {
      const convs = await getCustomerConversations(customer.id);
      setCustomerConversations(convs);
    } catch (e) {
      console.error('Failed to load customer conversations:', e);
      setCustomerConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedCustomer(null);
    setCustomerConversations([]);
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().toLowerCase();
    if (!trimmed) return;
    if (!editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setIsSaving(true);
      const updated = await updateCustomer(selectedCustomer.id, {
        display_name: editDisplayName,
        phone: editPhone,
        email: editEmail,
        preferred_language: editPreferredLanguage,
        notes: editNotes,
        tags: editTags.join(', '),
      });

      toast.success('Customer profile saved successfully!');

      // Update local state list
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
      setSelectedCustomer((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (e) {
      console.error('Failed to update customer profile:', e);
      toast.error('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalCount = customers.length;
    const vipOrTaggedCount = customers.filter((c) => {
      const tags = parseTags(c.tags);
      return tags.length > 0;
    }).length;
    const totalConversations = customers.reduce(
      (acc, c) => acc + (c.total_conversations || 0),
      0
    );

    return { totalCount, vipOrTaggedCount, totalConversations };
  }, [customers]);

  // Extract unique available tags for filter dropdown
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>(PREDEFINED_TAGS);
    customers.forEach((c) => {
      parseTags(c.tags).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [customers]);

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <PageHeader
        title="Customer Profiles (CDP)"
        desc="Centralized Customer Data Platform — identities, cross-channel interaction memory, tags, and internal notes."
        descAr="ملفات العملاء والذاكرة الموحدة للمحادثات"
        action={
          <button
            onClick={fetchCustomers}
            className="btn btn-secondary text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5"
            aria-label="Refresh profiles"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Quick Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Total Profiles"
          value={stats.totalCount}
          icon={Users}
          accent="terracotta"
        />
        <StatCard
          label="Tagged / VIP Customers"
          value={stats.vipOrTaggedCount}
          icon={Award}
          accent="gold"
        />
        <StatCard
          label="Total Conversations (CDP)"
          value={stats.totalConversations}
          icon={MessageSquare}
          accent="navy"
        />
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="card p-4 bg-white/80 backdrop-blur-md border border-sand-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ash-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone number, or WhatsApp user ID..."
              className="input pl-10 pr-4 py-2.5 text-xs w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ash-400 hover:text-ash-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative min-w-[180px] w-full md:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ash-400" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="input pl-9 pr-8 py-2.5 text-xs w-full appearance-none capitalize cursor-pointer"
              >
                <option value="">All Tag Filters</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    Tag: {tag}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || tagFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTagFilter('');
                }}
                className="btn btn-secondary text-xs px-3 py-2 whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="card p-12 text-center text-ash-400 animate-scale-in">
          <Users className="w-12 h-12 text-ash-300 mx-auto mb-3" />
          <p className="font-display font-bold text-navy-900 text-base mb-1">
            No Customer Profiles Found
          </p>
          <p className="text-xs text-ash-500 max-w-sm mx-auto">
            {searchQuery || tagFilter
              ? 'No customers match the specified search query or tag filter.'
              : 'Customer profiles will automatically be recorded as users interact with your bots.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden border border-sand-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sand-50/80 border-b border-sand-200 text-[11px] font-bold text-ash-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer Identity</th>
                  <th className="py-3.5 px-4">Phone / Channel ID</th>
                  <th className="py-3.5 px-4">Conversations & Msgs</th>
                  <th className="py-3.5 px-4">Tags</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 text-xs">
                {customers.map((customer) => {
                  const tags = parseTags(customer.tags);
                  const initial = (customer.display_name || customer.channel_user_id || 'U')
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-sand-50/60 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-700 flex items-center justify-center font-display font-bold text-xs flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-navy-900">
                              {customer.display_name || 'Unnamed Customer'}
                            </p>
                            {customer.email && (
                              <p className="text-[11px] text-ash-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone & Channel */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-ash-700">
                        <div className="flex items-center gap-2">
                          <span>{customer.phone || customer.channel_user_id}</span>
                          <span className="px-1.5 py-0.5 rounded bg-navy-800 text-sand-100 text-[10px] uppercase font-sans font-semibold">
                            {customer.channel}
                          </span>
                        </div>
                      </td>

                      {/* Conversations & Messages Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="badge bg-terracotta-500/10 text-terracotta-700 border border-terracotta-500/20 font-semibold gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {customer.total_conversations} convs
                          </span>
                          <span className="badge bg-navy-500/10 text-navy-700 border border-navy-500/20 font-semibold">
                            {customer.total_messages} msgs
                          </span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tags.length === 0 ? (
                            <span className="text-ash-300 italic text-[11px]">No tags</span>
                          ) : (
                            tags.map((t) => (
                              <span
                                key={t}
                                className={`badge border px-2 py-0.5 font-medium capitalize ${getTagBadgeClass(
                                  t
                                )}`}
                              >
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Last Seen */}
                      <td className="py-3.5 px-4 text-ash-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ash-400" />
                          {new Date(customer.last_seen_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(customer)}
                          className="btn btn-secondary text-xs py-1.5 px-3 font-semibold gap-1.5 text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer / Modal for Profile Details */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
            />

            {/* Slide-over Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-sand-200"
              >
                {/* Drawer Header */}
                <div className="p-6 bg-navy-900 text-sand-50 flex items-center justify-between border-b border-navy-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-terracotta-500/20 border border-terracotta-400/30 text-terracotta-400 flex items-center justify-center font-display font-bold text-sm">
                      {(editDisplayName || selectedCustomer.channel_user_id)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-white tracking-tight">
                        {editDisplayName || 'Customer Profile'}
                      </h2>
                      <p className="text-xs text-ash-400 font-mono">
                        {selectedCustomer.channel_user_id} · Channel: {selectedCustomer.channel}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="text-ash-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-sand-50/30">
                  {/* Form for Customer Attributes */}
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="card p-5 bg-white border-sand-200 shadow-sm space-y-4">
                      <h3 className="font-display text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 border-b border-sand-100 pb-2">
                        <Users className="w-4 h-4 text-terracotta-500" /> General Identity Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-ash-700 mb-1.5">
                            Display Name (الاسم)
                          </label>
                          <input
                            type="text"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            placeholder="e.g. Ahmed Ali"
                            className="input text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ash-700 mb-1.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-ash-400" /> Phone Number (رقم الهاتف)
                          </label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+201000000000"
                            className="input text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ash-700 mb-1.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-ash-400" /> Email Address (البريد الإلكتروني)
                          </label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="customer@example.com"
                            className="input text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-ash-700 mb-1.5 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-ash-400" /> Preferred Language (اللغة المفضلة)
                          </label>
                          <select
                            value={editPreferredLanguage}
                            onChange={(e) => setEditPreferredLanguage(e.target.value)}
                            className="input text-xs"
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Tag Editor Section */}
                    <div className="card p-5 bg-white border-sand-200 shadow-sm space-y-4">
                      <h3 className="font-display text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 border-b border-sand-100 pb-2">
                        <Tag className="w-4 h-4 text-terracotta-500" /> Customer Tags & Segmentation
                      </h3>

                      {/* Active Tags */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {editTags.length === 0 ? (
                          <span className="text-xs text-ash-400 italic">No tags assigned yet.</span>
                        ) : (
                          editTags.map((tag) => (
                            <span
                              key={tag}
                              className={`badge border px-2.5 py-1 text-xs font-semibold capitalize flex items-center gap-1.5 ${getTagBadgeClass(
                                tag
                              )}`}
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Add Tag Input */}
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag(newTagInput);
                            }
                          }}
                          placeholder="Type tag name and press Enter..."
                          className="input text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTag(newTagInput)}
                          disabled={!newTagInput.trim()}
                          className="btn btn-secondary text-xs px-3 py-1.5 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Tag
                        </button>
                      </div>

                      {/* Quick Suggestion Pills */}
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-ash-400 uppercase tracking-wider block mb-1.5">
                          Quick Suggestions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PREDEFINED_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddTag(tag)}
                              disabled={editTags.includes(tag)}
                              className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                                editTags.includes(tag)
                                  ? 'bg-sand-100 text-ash-400 border-sand-200 cursor-not-allowed opacity-50'
                                  : 'bg-sand-50 hover:bg-terracotta-50 text-navy-900 border-sand-200 hover:border-terracotta-300'
                              }`}
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Agent Notes Textarea */}
                    <div className="card p-5 bg-white border-sand-200 shadow-sm space-y-3">
                      <h3 className="font-display text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2 border-b border-sand-100 pb-2">
                        <FileText className="w-4 h-4 text-terracotta-500" /> Internal Agent Notes (ملاحظات الدعم الداخلي)
                      </h3>
                      <textarea
                        rows={4}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Write internal notes about customer preferences, complaint history, VIP requests, or specific instructions..."
                        className="input text-xs leading-relaxed font-arabic text-right"
                        dir="rtl"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Customer Conversation History Section */}
                  <div className="card p-5 bg-white border-sand-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-sand-100 pb-2">
                      <h3 className="font-display text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-terracotta-500" /> Conversation History Across Bots ({customerConversations.length})
                      </h3>
                    </div>

                    {conversationsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                      </div>
                    ) : customerConversations.length === 0 ? (
                      <div className="p-6 text-center text-ash-400 text-xs">
                        No recorded conversations found for this customer profile yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {customerConversations.map((conv) => (
                          <div
                            key={conv.id}
                            className="p-3.5 rounded-lg border border-sand-200 bg-sand-50/50 hover:bg-sand-50 transition-colors flex items-center justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-navy-900">
                                  Conv #{conv.id.slice(0, 8)}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-navy-800 text-sand-100 text-[10px] uppercase font-semibold">
                                  {conv.channel}
                                </span>
                                <span
                                  className={`badge ${
                                    conv.status === 'active'
                                      ? 'badge-active'
                                      : conv.status === 'handed_off'
                                      ? 'badge-handoff'
                                      : 'badge-inactive'
                                  }`}
                                >
                                  {conv.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-ash-500 font-mono">
                                Bot ID: {conv.bot_id}
                              </p>
                            </div>
                            <div className="text-right text-[11px] text-ash-400">
                              <p className="font-mono">
                                Started:{' '}
                                {new Date(conv.started_at).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              {conv.last_message_at && (
                                <p className="text-[10px] text-ash-400">
                                  Last msg:{' '}
                                  {new Date(conv.last_message_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
