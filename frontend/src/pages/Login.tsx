import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { login } from '../lib/api';

export default function Login() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      await refresh();
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex noise-overlay">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-navy-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 grain-bg" />
        <div className="absolute -top-20 -right-20 w-80 h-80 border-2 border-terracotta-500/10 rotate-12" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 border border-gold-400/5 rotate-45" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-terracotta-500/8 rotate-[30deg]" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-terracotta-500/15 flex items-center justify-center border border-terracotta-500/20">
              <span className="font-display text-2xl font-bold text-terracotta-400">A</span>
            </div>
          </div>
          <h1 className="font-display text-4xl font-semibold text-sand-50 mb-3">ArabBot Studio</h1>
          <p className="font-body text-lg text-ash-400 max-w-sm mx-auto leading-relaxed">
            Build intelligent WhatsApp bots for your business with AI-powered conversations.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-bg-warm">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-10">
            <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy-800 mb-4">
              <span className="font-display text-lg font-bold text-terracotta-400">A</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-navy-900 mb-1">Welcome back</h2>
            <p className="font-body text-sm text-ash-500">Sign in to manage your bots</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-terracotta-50 border border-terracotta-300/30 rounded-lg">
              <p className="text-sm text-terracotta-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="relative w-full py-3 font-display font-medium text-sm tracking-wider text-white bg-navy-700 rounded-lg hover:bg-navy-600 disabled:opacity-50 transition-all duration-200 overflow-hidden group"
            >
              <span className="relative z-10">{loading ? 'Signing in...' : 'Sign In'}</span>
              <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          <p className="mt-8 text-center font-body text-sm text-ash-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
