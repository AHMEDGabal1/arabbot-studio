import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { register } from '../lib/api';
import { extractErrorMessage } from '../lib/utils';

import { LogoMark } from '../components/Logo';

export default function Register() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, phone || undefined);
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
            <h2 className="font-display text-2xl font-bold text-white mb-1">Create account</h2>
            <p className="font-arabic text-sm text-emerald-400 mb-1" dir="rtl">ابدأ ببناء بوتاتك الآن</p>
            <p className="font-body text-sm text-slate-400">Start building your bots</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-scale-in" role="alert">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block font-body text-sm font-medium text-slate-300 mb-1">
                Email <span className="font-arabic text-emerald-400 text-xs">البريد الإلكتروني</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="reg-name" className="block font-body text-sm font-medium text-slate-300 mb-1">
                Name <span className="font-arabic text-emerald-400 text-xs">الاسم</span>
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Your business name"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block font-body text-sm font-medium text-slate-300 mb-1">
                Phone <span className="font-arabic text-emerald-400 text-xs">رقم الهاتف</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="+201234567890"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block font-body text-sm font-medium text-slate-300 mb-1">
                Password <span className="font-arabic text-emerald-400 text-xs">كلمة المرور</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
              
              <div className="mt-2.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Password Requirements</span>
                  <span className="font-arabic text-emerald-400 text-xs" dir="rtl">تعليمات كلمة المرور</span>
                </p>
                <ul className="space-y-1.5 pt-1">
                  <li className={`flex items-center gap-2 transition-colors ${password.length >= 8 ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${password.length >= 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                      {password.length >= 8 ? '✓' : '•'}
                    </span>
                    <span>At least 8 characters <span className="font-arabic text-slate-500 text-[11px]">(8 أحرف على الأقل)</span></span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${/[A-Z]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                      {/[A-Z]/.test(password) ? '✓' : '•'}
                    </span>
                    <span>At least 1 uppercase letter <span className="font-arabic text-slate-500 text-[11px]">(حرف كبير A-Z)</span></span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors ${/[0-9]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${/[0-9]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                      {/[0-9]/.test(password) ? '✓' : '•'}
                    </span>
                    <span>At least 1 number <span className="font-arabic text-slate-500 text-[11px]">(رقم 0-9)</span></span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn bg-emerald-500 hover:bg-emerald-600 text-white font-bold justify-center py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all mt-2"
            >
              {loading ? 'Creating account...' : <><span>Create Account</span> <span className="font-arabic text-emerald-100 text-xs">إنشاء حساب</span></>}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-slate-400">
            <span className="font-arabic text-slate-400 text-xs">لديك حساب بالفعل؟</span> Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
