import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { register } from '../lib/api';

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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex noise-overlay">
      <div className="hidden lg:flex w-1/2 bg-navy-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 grain-bg" />
        <div className="absolute -top-20 -right-20 w-80 h-80 border-2 border-terracotta-500/10 rotate-12" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 border border-gold-400/5 rotate-45" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-terracotta-500/8 rotate-[30deg]" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-terracotta-500/15 flex items-center justify-center border border-terracotta-500/20 overflow-hidden">
              <img src="/logo.svg" alt="ArabBot" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-semibold text-sand-50 mb-3">ArabBot Studio</h1>
          <p className="font-body text-lg text-ash-400 max-w-sm mx-auto leading-relaxed">
            Build intelligent WhatsApp bots for your business with AI-powered conversations.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-bg-warm">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-10">
            <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy-800 mb-4 overflow-hidden">
              <img src="/logo.svg" alt="ArabBot" className="w-7 h-7 object-contain" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-navy-900 mb-1">Create account</h2>
            <p className="font-body text-sm text-ash-500">Start building your bots</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-terracotta-50 border border-terracotta-300/30 rounded-lg animate-scale-in" role="alert">
              <p className="text-sm text-terracotta-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-email" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Email</label>
              <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="reg-name" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Name</label>
              <input id="reg-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your business name" />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Phone (optional)</label>
              <input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+201234567890" />
            </div>
            <div>
              <label htmlFor="reg-password" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Password</label>
              <input id="reg-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3 group relative overflow-hidden">
              <span className="relative z-10">{loading ? 'Creating account...' : 'Create Account'}</span>
              <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          <p className="mt-8 text-center font-body text-sm text-ash-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
