import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, type Variants } from 'framer-motion';
import { getAnalyticsOverview, getBotAnalytics, listBots } from '../lib/api';
import type { Analytics as AnalyticsType, Bot } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

const COLORS = ['#c1694f', '#e9b741', '#2a3050', '#6b6360', '#d4836a', '#b8891e', '#4a5278', '#8a8079', '#e09d87'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Analytics() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [data, setData] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setBots(await listBots()); } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setData(selectedBot ? await getBotAnalytics(selectedBot) : await getAnalyticsOverview());
      } catch (e) { console.error(e); }
    })();
  }, [selectedBot]);

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Analytics" desc="Loading..." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
    </div>
  );

  const intentData = data?.intent_breakdown
    ? Object.entries(data.intent_breakdown).map(([name, value]) => ({ name, value })) : [];

  const overviewCards = [
    { label: 'Total Conversations', value: data?.total_conversations ?? 0, icon: 'MessageCircle' },
    { label: 'Total Messages', value: data?.total_messages ?? 0, icon: 'MessageSquare' },
    { label: 'Intents Detected', value: intentData.reduce((s, i) => s + i.value, 0), icon: 'Brain' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Analytics"
          desc="Track bot performance and usage"
          descAr="تحليلات أداء البوتات"
          action={
            <select value={selectedBot} onChange={(e) => setSelectedBot(e.target.value)} className="input max-w-[200px]" aria-label="Filter by bot">
              <option value="">All bots</option>
              {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
            </select>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {overviewCards.map(({ label, value }) => (
          <motion.div key={label} whileHover={{ y: -4, scale: 1.02 }} className="card relative overflow-hidden p-6 bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] group">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-terracotta-500/10 rounded-full blur-xl transition-transform duration-500 group-hover:scale-150 group-hover:bg-terracotta-500/15" />
            <div className="relative z-10">
              <p className="font-body text-xs font-semibold text-ash-500 tracking-wider uppercase mb-1">{label}</p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="font-display text-4xl font-bold text-navy-900 tracking-tight">{value}</motion.p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data?.messages_over_time && data.messages_over_time.length > 0 && (
          <motion.div whileHover={{ y: -2 }} className="card p-6 bg-white/60 backdrop-blur-md shadow-sm">
            <h2 className="font-display text-lg font-bold text-navy-900 mb-6">Messages Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.messages_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dfdbd7" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8a8079' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#8a8079' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(193, 105, 79, 0.05)' }} contentStyle={{ background: '#1a1f2e', border: 'none', borderRadius: '12px', color: '#f5ede6', fontSize: '13px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#c1694f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {intentData.length > 0 && (
          <motion.div whileHover={{ y: -2 }} className="card p-6 bg-white/60 backdrop-blur-md shadow-sm">
            <h2 className="font-display text-lg font-bold text-navy-900 mb-6">Intent Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={intentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={70} stroke="none" labelLine={false}>
                  {intentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1f2e', border: 'none', borderRadius: '12px', color: '#f5ede6', fontSize: '13px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Legend formatter={(value: string) => <span style={{ color: '#4a5278', fontSize: '13px', fontWeight: 500 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
