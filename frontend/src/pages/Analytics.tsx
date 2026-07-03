import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAnalyticsOverview, getBotAnalytics, listBots } from '../lib/api';
import type { Analytics as AnalyticsType, Bot } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

const COLORS = ['#c1694f', '#e9b741', '#2a3050', '#6b6360', '#d4836a', '#b8891e', '#4a5278', '#8a8079', '#e09d87'];

export default function Analytics() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [data, setData] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setBots(await listBots()); } catch {} finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setData(selectedBot ? await getBotAnalytics(selectedBot) : await getAnalyticsOverview());
      } catch {}
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
    <div className="animate-fade-up">
      <PageHeader
        title="Analytics"
        desc="Track bot performance and usage"
        action={
          <select value={selectedBot} onChange={(e) => setSelectedBot(e.target.value)} className="input max-w-[200px]" aria-label="Filter by bot">
            <option value="">All bots</option>
            {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
          </select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {overviewCards.map(({ label, value }, i) => (
          <div key={label} className="card card-hover p-5 animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-terracotta-500/5 rounded-full" />
            <p className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase">{label}</p>
            <p className="font-display text-3xl font-semibold text-navy-900 mt-1.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {data?.messages_over_time && data.messages_over_time.length > 0 && (
          <div className="card p-6 animate-scale-in">
            <h2 className="font-display text-base font-semibold text-navy-900 mb-4">Messages Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.messages_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dfdbd7" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8a8079' }} />
                <YAxis tick={{ fontSize: 12, fill: '#8a8079' }} />
                <Tooltip contentStyle={{ background: '#1a1f2e', border: 'none', borderRadius: '8px', color: '#f5ede6', fontSize: '13px' }} />
                <Bar dataKey="count" fill="#c1694f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {intentData.length > 0 && (
          <div className="card p-6 animate-scale-in">
            <h2 className="font-display text-base font-semibold text-navy-900 mb-4">Intent Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={intentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {intentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1f2e', border: 'none', borderRadius: '8px', color: '#f5ede6', fontSize: '13px' }} />
                <Legend formatter={(value: string) => <span style={{ color: '#6b6360', fontSize: '12px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
