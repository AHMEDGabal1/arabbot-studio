import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Bot, MessageCircle, Handshake, Plus, 
  Sparkles, ArrowRight, Zap, Activity, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { listBots, getAnalyticsOverview } from '../lib/api';
import type { Analytics, Bot as BotType } from '../types';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../lib/auth';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotType[]>([]);
  const [stats, setStats] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulated live event feed
  const liveEvents = [
    { id: 1, time: 'الآن', text: 'عميل من الرياض استفسر عن مواعيد التوصيل (العامية السعودية)', intent: 'SHIPPING_INQUIRY', status: 'resolved' },
    { id: 2, time: 'منذ 2 د', text: 'عميل من القاهرة قام بطلب تأكيد الشحن (العامية المصرية)', intent: 'ORDER_CONFIRM', status: 'resolved' },
    { id: 3, time: 'منذ 5 د', text: 'طلب تحويل لموظف بشري بخصوص مشكلة دفع (دبي)', intent: 'HUMAN_REQUEST', status: 'handoff' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [botsResult, analyticsResult] = await Promise.allSettled([listBots(), getAnalyticsOverview()]);
        if (botsResult.status === 'fulfilled') setBots(botsResult.value);
        else toast.error('Failed to load bots');
        if (analyticsResult.status === 'fulfilled') setStats(analyticsResult.value);
        else toast.error('Failed to load analytics');
      } catch (e) { 
        console.error(e); 
        toast.error('Failed to load dashboard data'); 
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { ar: 'صباح الخير والبركة', en: 'Good morning' };
    if (hour < 18) return { ar: 'مساء الخير والإنتاجية', en: 'Good afternoon' };
    return { ar: 'مساء النور والإنجاز', en: 'Good evening' };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" desc="Loading your ecosystem..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const activeBots = bots.filter((b) => b.is_active).length;
  const greeting = getGreeting();

  const statCards = [
    { label: 'Total Bots', value: bots.length, icon: Bot, accent: 'terracotta' as const },
    { label: 'Active Bots', value: activeBots, icon: Zap, accent: 'gold' as const },
    { label: 'Total Conversations', value: stats?.total_conversations ?? 0, icon: MessageCircle, accent: 'navy' as const },
    { label: 'Human Handoffs', value: stats?.intent_breakdown?.['HUMAN_REQUEST'] ?? 0, icon: Handshake, accent: 'ash' as const },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
      {/* Dynamic Welcome Hero Banner */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1322] via-[#121a2d] to-[#18233c] p-7 sm:p-8 text-sand-50 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-500/15 border border-terracotta-500/30 text-terracotta-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-arabic" dir="rtl">{greeting.ar}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {greeting.en}, {user?.email?.split('@')[0] || 'Partner'}
            </h1>
            <p className="font-body text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Your dialect-aware WhatsApp bots are active and monitoring customer conversations across Egyptian, Saudi, and Gulf channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/bots/new"
              className="btn btn-primary font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-terracotta-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bot</span>
            </Link>
            <Link
              to="/conversations"
              className="btn bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              Live Chat
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </motion.div>

      {/* Main Grid: Recent Bots & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Bots */}
        <motion.div variants={itemVariants} className="lg:col-span-7 card overflow-hidden bg-white/80 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-sand-100 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-navy-900">Your WhatsApp Bots</h2>
              <p className="font-body text-xs text-ash-400 mt-0.5 font-arabic" dir="rtl">قائمة البوتات النشطة والمخصصة</p>
            </div>
            {bots.length > 0 && (
              <Link to="/bots" className="text-xs font-bold text-terracotta-500 hover:text-terracotta-600 transition-colors flex items-center gap-1">
                <span>View all ({bots.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="p-5">
            {bots.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-terracotta-50 border border-terracotta-200 flex items-center justify-center mx-auto text-terracotta-500">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-display text-sm font-bold text-navy-900">No bots configured yet</h3>
                <p className="font-body text-xs text-ash-400 max-w-sm mx-auto">
                  Create your first Arabic dialect bot to start automating WhatsApp inquiries.
                </p>
                <Link to="/bots/new" className="btn btn-primary text-xs font-bold px-4 py-2 mt-2 inline-flex">
                  <Plus className="w-3.5 h-3.5" /> Create Bot
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bots.slice(0, 5).map((bot) => (
                  <Link
                    key={bot.id}
                    to={`/bots/${bot.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-sand-200 hover:border-terracotta-300 hover:bg-terracotta-50/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${bot.is_active ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : 'bg-sand-300'}`} />
                      <div>
                        <div className="font-body text-sm font-bold text-navy-900 group-hover:text-terracotta-600 transition-colors">
                          {bot.name}
                        </div>
                        <div className="text-[11px] text-ash-400 font-mono">
                          Channel: {bot.channel.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="badge badge-amber text-[10px]">
                        {bot.language}
                      </span>
                      <span className={`badge text-[10px] ${bot.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Real-Time Dialect Activity Stream */}
        <motion.div variants={itemVariants} className="lg:col-span-5 card overflow-hidden bg-white/80 backdrop-blur-md shadow-sm">
          <div className="p-5 border-b border-sand-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-terracotta-500" />
              <div>
                <h2 className="font-display text-base font-bold text-navy-900">Live AI Feed</h2>
                <p className="font-body text-[11px] text-ash-400 font-arabic" dir="rtl">سجل الأحداث المباشر</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
              Real-Time
            </span>
          </div>

          <div className="p-5 space-y-3 font-arabic" dir="rtl">
            {liveEvents.map((evt) => (
              <div key={evt.id} className="p-3.5 rounded-xl bg-sand-50/70 border border-sand-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-[11px]">{evt.intent}</span>
                  <span className="text-[10px] text-ash-400 font-mono" dir="ltr">{evt.time}</span>
                </div>
                <p className="text-ash-600 leading-relaxed">{evt.text}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className={`badge text-[10px] ${evt.status === 'resolved' ? 'badge-active' : 'badge-handoff'}`}>
                    {evt.status === 'resolved' ? 'تم الرد الآلي' : 'طابور التحويل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Launchpad Studio Bar */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/customers" className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-terracotta-300 hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-navy-900 group-hover:text-terracotta-600 transition-colors">Customer CDP</h4>
            <p className="text-[11px] text-ash-400 font-arabic" dir="rtl">سجل تفضيلات العملاء الموحد</p>
          </div>
        </Link>

        <Link to="/handoffs" className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-terracotta-300 hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-navy-900 group-hover:text-terracotta-600 transition-colors">Handoffs Queue</h4>
            <p className="text-[11px] text-ash-400 font-arabic" dir="rtl">طابور استلام الدعم البشري</p>
          </div>
        </Link>

        <Link to="/analytics" className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-terracotta-300 hover:shadow-md transition-all flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs text-navy-900 group-hover:text-terracotta-600 transition-colors">Dialect Analytics</h4>
            <p className="text-[11px] text-ash-400 font-arabic" dir="rtl">تحليلات دقة اللهجات والمبيعات</p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
