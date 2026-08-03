import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { login as apiLogin } from '../lib/api';
import { extractErrorMessage } from '../lib/utils';

import { LogoMark } from '../components/Logo';

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
    <div className="min-h-screen flex noise-overlay">
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center p-12 border-r border-slate-800">
        <div className="absolute inset-0 cyber-grid-bg" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <LogoMark size="lg" />
          </div>
          <h1 className="font-display text-5xl font-extrabold text-white mb-4">ArabBot Studio</h1>
          <p className="font-arabic text-2xl font-bold text-emerald-400 mb-4 leading-relaxed tracking-wide" dir="rtl">
            بوتات واتساب ذكية مدعومة بالذكاء الاصطناعي
          </p>
          <p className="font-body text-lg text-slate-300 max-w-sm mx-auto leading-relaxed">
            Build intelligent WhatsApp bots for your business with AI-powered conversations.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-900 text-white">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-10">
            <div className="lg:hidden inline-flex items-center justify-center mb-4">
              <LogoMark size="md" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="font-arabic text-sm text-emerald-400 mb-1" dir="rtl">سجل دخولك لإدارة البوتات</p>
            <p className="font-body text-sm text-slate-400">Sign in to manage your bots</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-scale-in" role="alert">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block font-body text-sm font-medium text-slate-300 mb-1.5">
                Email <span className="font-arabic text-emerald-400 text-xs">البريد الإلكتروني</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block font-body text-sm font-medium text-slate-300 mb-1.5">
                Password <span className="font-arabic text-emerald-400 text-xs">كلمة المرور</span>
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn bg-emerald-500 hover:bg-emerald-600 text-white font-bold justify-center py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              {loading ? 'Signing in...' : <><span>Sign In</span> <span className="font-arabic text-emerald-100 text-xs">تسجيل دخول</span></>}
            </button>
          </form>

          <p className="mt-8 text-center font-body text-sm text-slate-400">
            <span className="font-arabic text-slate-400 text-xs">ليس لديك حساب؟</span> Don't have an account?{' '}
            <Link to="/register" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
