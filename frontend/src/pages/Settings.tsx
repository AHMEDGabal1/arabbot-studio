import { useAuth } from '../lib/auth';
import { User, Phone } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Settings</h1>
        <p className="font-body text-sm text-ash-500 mt-1">Manage your account and integrations</p>
      </div>

      <div className="bg-bg-card rounded-lg border border-sand-200 p-6">
        <h2 className="font-display text-base font-semibold text-navy-900 mb-4">Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-sand-100" />
            </div>
            <div>
              <p className="font-body text-xs text-ash-400">Email</p>
              <p className="font-body text-sm font-medium text-navy-900">{user?.email}</p>
            </div>
          </div>
          {user?.phone && (
            <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center">
                <Phone className="w-4.5 h-4.5 text-sand-100" />
              </div>
              <div>
                <p className="font-body text-xs text-ash-400">Phone</p>
                <p className="font-body text-sm font-medium text-navy-900">{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-bg-card rounded-lg border border-sand-200 p-6">
        <h2 className="font-display text-base font-semibold text-navy-900 mb-4">Webhook URLs</h2>
        <p className="font-body text-sm text-ash-500 mb-3">Configure these URLs in your Meta Business dashboard:</p>
        <div className="space-y-3">
          <div className="p-3 bg-sand-50 rounded-lg">
            <p className="font-body text-xs text-ash-400 mb-1">Callback URL</p>
            <code className="font-body text-sm text-terracotta-500">{window.location.origin}/webhooks/whatsapp/{'{bot_id}'}</code>
          </div>
          <div className="p-3 bg-sand-50 rounded-lg">
            <p className="font-body text-xs text-ash-400 mb-1">Verify Token</p>
            <code className="font-body text-sm text-terracotta-500">Your bot's WhatsApp Access Token</code>
          </div>
        </div>
      </div>
    </div>
  );
}
