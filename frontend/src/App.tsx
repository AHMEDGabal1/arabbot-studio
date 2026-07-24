import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-load authenticated pages to split the ~932 kB bundle into smaller chunks.
// Landing/Login/Register are kept eager because they are the initial entry points.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BotsList = lazy(() => import('./pages/BotsList'));
const BotEditor = lazy(() => import('./pages/BotEditor'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const Conversations = lazy(() => import('./pages/Conversations'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Handoffs = lazy(() => import('./pages/Handoffs'));
const Settings = lazy(() => import('./pages/Settings'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminWorkspaces = lazy(() => import('./pages/admin/AdminWorkspaces'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
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
            <Route element={<Suspense fallback={<LoadingSpinner fullScreen />}><AdminLayout /></Suspense>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/workspaces" element={<AdminWorkspaces />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
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
