import { useAuth } from '../lib/auth';
import { User, Phone } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
          {user?.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{user.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook URLs</h2>
        <p className="text-sm text-gray-500 mb-3">Configure these URLs in your Meta Business dashboard:</p>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Callback URL</p>
            <code className="text-sm text-blue-600">{window.location.origin}/webhooks/whatsapp/{'{bot_id}'}</code>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Verify Token</p>
            <code className="text-sm text-blue-600">Your bot's WhatsApp Access Token</code>
          </div>
        </div>
      </div>
    </div>
  );
}
