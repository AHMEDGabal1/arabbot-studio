import { useAuth } from '../lib/auth';
import { User, Phone, Copy, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [copiedUrl, setCopiedUrl] = useState(false);

  const webhookUrl = `${window.location.origin}/webhooks/whatsapp/{bot_id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <PageHeader 
        title="Settings & Integrations" 
        desc="Manage your workspace credentials and Meta WhatsApp Webhooks" 
        descAr="إدارة الحساب، اعتمادات واتساب وربط Webhook" 
      />

      {/* Account Profile Card */}
      <div className="card p-6 shadow-sm border border-sand-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-navy-900">Account Profile</h2>
          <span className="badge badge-amber text-xs">Admin Workspace</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3.5 p-3.5 bg-sand-50/80 rounded-xl border border-sand-200">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shrink-0" aria-hidden="true">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-body text-xs text-ash-400">Email Address</p>
              <p className="font-body text-sm font-bold text-navy-900">{user?.email}</p>
            </div>
          </div>

          {user?.phone && (
            <div className="flex items-center gap-3.5 p-3.5 bg-sand-50/80 rounded-xl border border-sand-200">
              <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shrink-0" aria-hidden="true">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-body text-xs text-ash-400">Phone Number</p>
                <p className="font-body text-sm font-bold text-navy-900">{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Meta Cloud API Webhook Integration */}
      <div className="card p-6 shadow-sm border border-sand-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-base font-bold text-navy-900">Meta Cloud Webhook URLs</h2>
          <span className="badge badge-active text-[10px]">Cloud API Ready</span>
        </div>
        <p className="font-body text-xs text-ash-500 mb-4 leading-relaxed">
          Configure these endpoints in your Meta for Developers Dashboard under the WhatsApp Configuration section:
        </p>

        <div className="space-y-3.5">
          <div className="p-4 bg-sand-50/80 border border-sand-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-bold text-ash-600">Callback URL</span>
              <button 
                onClick={() => copyToClipboard(webhookUrl)}
                className="text-xs text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-1"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="font-mono text-xs text-terracotta-600 block break-all bg-white p-2.5 rounded-lg border border-sand-200">
              {webhookUrl}
            </code>
          </div>

          <div className="p-4 bg-sand-50/80 border border-sand-200 rounded-xl space-y-1.5">
            <span className="font-body text-xs font-bold text-ash-600">Verify Token</span>
            <div className="font-mono text-xs text-navy-900 bg-white p-2.5 rounded-lg border border-sand-200">
              Use the WhatsApp Access Token configured in your Bot Studio settings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
