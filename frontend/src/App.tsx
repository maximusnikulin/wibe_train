import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { FanDashboard } from './pages/FanDashboard';
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { BetEvents } from './pages/BetEvents';
import { BetEventDetails } from './pages/BetEventDetails';
import { MockPayment } from './pages/MockPayment';
import { NotFound } from './pages/NotFound';
import { ManageBetEvents } from './pages/ManageBetEvents';
import { UserProfile } from './pages/UserProfile';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fan-dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['fan']}>
                    <FanDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/participant-dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['participant']}>
                    <ParticipantDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bet-events"
              element={
                <ProtectedRoute>
                  <BetEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bet-events/:id"
              element={
                <ProtectedRoute>
                  <BetEventDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-events"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <ManageBetEvents />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route path="/mock-payment/:paymentId" element={<MockPayment />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
