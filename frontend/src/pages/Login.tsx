import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { login as apiLogin } from '../lib/api';
import { extractErrorMessage } from '../lib/utils';
import { LogoMark } from '../components/Logo';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function Login() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiLogin(email, password);
      await refresh();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex noise-overlay bg-[#080c14]">
      {/* Left Ambient Brand Showcase */}
      <div className="hidden lg:flex w-1/2 bg-[#080c14] relative overflow-hidden items-center justify-center p-12 border-r border-slate-800">
        <div className="absolute inset-0 midnight-grid-bg" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-md space-y-6">
          <div className="inline-flex items-center justify-center">
            <LogoMark size="lg" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-extrabold text-white mb-2 tracking-tight">ArabBot Studio</h1>
            <p className="font-arabic text-xl font-bold text-terracotta-400 leading-relaxed" dir="rtl">
              المنصة المتكاملة لبناء بوتات الواتساب بالذكاء الاصطناعي
            </p>
          </div>

          <p className="font-body text-sm text-slate-300 leading-relaxed">
            Build, test, and deploy dialect-aware WhatsApp AI agents with strict brand safety guardrails and unified customer CDP.
          </p>

          <div className="pt-6 grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 bg-[#101624] border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-terracotta-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold font-display">&lt; 240ms Latency</span>
              </div>
              <p className="text-[11px] text-slate-400 font-arabic" dir="rtl">رد فوري بالعامية</p>
            </div>
            <div className="p-3.5 bg-[#101624] border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-gold-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold font-display">Saudi PDPL Ready</span>
              </div>
              <p className="text-[11px] text-slate-400 font-arabic" dir="rtl">حماية البيانات والأمان</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0b101c] text-white">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <div className="lg:hidden inline-flex items-center justify-center mb-4">
              <LogoMark size="md" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تسجيل الدخول الآمن</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="font-arabic text-sm text-slate-400" dir="rtl">سجل دخولك لإدارة البوتات والمحادثات</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl animate-scale-in" role="alert">
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block font-body text-xs font-medium text-slate-300 mb-1.5">
                Email <span className="font-arabic text-terracotta-400 text-xs">البريد الإلكتروني</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-terracotta-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block font-body text-xs font-medium text-slate-300 mb-1.5">
                Password <span className="font-arabic text-terracotta-400 text-xs">كلمة المرور</span>
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-terracotta-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary justify-center py-3.5 rounded-xl font-bold shadow-lg shadow-terracotta-500/25 transition-all mt-2"
            >
              {loading ? 'Signing in...' : <><span>Sign In</span> <span className="font-arabic text-terracotta-100 text-xs">تسجيل دخول</span></>}
            </button>
          </form>

          <p className="mt-8 text-center font-body text-xs text-slate-400">
            <span className="font-arabic text-slate-400">ليس لديك حساب؟</span> Don't have an account?{' '}
            <Link to="/register" className="font-bold text-terracotta-400 hover:text-terracotta-300 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
