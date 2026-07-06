import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BotsList from './pages/BotsList';
import BotEditor from './pages/BotEditor';
import KnowledgeBase from './pages/KnowledgeBase';
import Conversations from './pages/Conversations';
import Analytics from './pages/Analytics';
import Handoffs from './pages/Handoffs';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bots" element={<BotsList />} />
              <Route path="/bots/new" element={<BotEditor />} />
              <Route path="/bots/:id" element={<BotEditor />} />
              <Route path="/bots/:botId/knowledge" element={<KnowledgeBase />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/handoffs" element={<Handoffs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ErrorBoundary>
          <Toaster
            position="top-left"
            toastOptions={{
              style: {
                background: '#1a1f2e',
                color: '#f5ede6',
                border: '1px solid #2a3050',
                borderRadius: '8px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
