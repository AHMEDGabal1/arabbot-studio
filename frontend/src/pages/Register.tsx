import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { register } from '../lib/api';
import { extractErrorMessage } from '../lib/utils';
import { LogoMark } from '../components/Logo';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

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
              ابدأ بناء أول بوت واتساب يفهم العامية
            </p>
          </div>

          <p className="font-body text-sm text-slate-300 leading-relaxed">
            Join hundreds of leading Middle Eastern brands elevating their customer experience with native Arabic AI conversations.
          </p>

          <div className="pt-6 grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 bg-[#101624] border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-terracotta-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold font-display">14-Day Free Trial</span>
              </div>
              <p className="text-[11px] text-slate-400 font-arabic" dir="rtl">بدون بطاقة بنكية</p>
            </div>
            <div className="p-3.5 bg-[#101624] border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-gold-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold font-display">Meta API Ready</span>
              </div>
              <p className="text-[11px] text-slate-400 font-arabic" dir="rtl">ربط فوري بالواتساب</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0b101c] text-white">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <div className="lg:hidden inline-flex items-center justify-center mb-4">
              <LogoMark size="md" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>إنشاء حساب جديد</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Create account</h2>
            <p className="font-arabic text-sm text-slate-400" dir="rtl">ابدأ ببناء وتخصيص بوتاتك خلال دقيقتين</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl animate-scale-in" role="alert">
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block font-body text-xs font-medium text-slate-300 mb-1">
                Email <span className="font-arabic text-terracotta-400 text-xs">البريد الإلكتروني</span>
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-terracotta-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="reg-name" className="block font-body text-xs font-medium text-slate-300 mb-1">
                Name <span className="font-arabic text-terracotta-400 text-xs">الاسم أو اسم المتجر</span>
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-terracotta-500 transition-colors"
                placeholder="اسم شركتك أو متجرك"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block font-body text-xs font-medium text-slate-300 mb-1">
                Phone <span className="font-arabic text-terracotta-400 text-xs">رقم الهاتف</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-terracotta-500 transition-colors"
                placeholder="+201234567890 / +966500000000"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block font-body text-xs font-medium text-slate-300 mb-1">
                Password <span className="font-arabic text-terracotta-400 text-xs">كلمة المرور</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-terracotta-500 transition-colors"
                placeholder="••••••••"
              />
              
              <div className="mt-2.5 p-3 bg-[#070b14] border border-slate-800/80 rounded-xl space-y-1.5 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Password Requirements</span>
                  <span className="font-arabic text-terracotta-400 text-xs" dir="rtl">تعليمات كلمة المرور</span>
                </p>
                <ul className="space-y-1 pt-1 text-[11px]">
                  <li className={`flex items-center gap-2 transition-colors ${password.length >= 8 ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${password.length >= 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                      {password.length >= 8 ? '✓' : '•'}
                    </span>
                    <span>At least 8 characters <span className="font-arabic text-slate-500">(8 أحرف على الأقل)</span></span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[A-Z]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                      {/[A-Z]/.test(password) ? '✓' : '•'}
                    </span>
                    <span>At least 1 uppercase letter <span className="font-arabic text-slate-500">(حرف كبير A-Z)</span></span>
                  </li>
                  <li className={`flex items-center gap-2 transition-colors ${/[0-9]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[0-9]/.test(password) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                      {/[0-9]/.test(password) ? '✓' : '•'}
                    </span>
                    <span>At least 1 number <span className="font-arabic text-slate-500">(رقم 0-9)</span></span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary justify-center py-3 rounded-xl font-bold shadow-lg shadow-terracotta-500/25 transition-all mt-2"
            >
              {loading ? 'Creating account...' : <><span>Create Account</span> <span className="font-arabic text-terracotta-100 text-xs">إنشاء حساب</span></>}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-xs text-slate-400">
            <span className="font-arabic text-slate-400">لديك حساب بالفعل؟</span> Already have an account?{' '}
            <Link to="/login" className="font-bold text-terracotta-400 hover:text-terracotta-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
