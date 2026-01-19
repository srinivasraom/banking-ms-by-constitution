import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Navigation component
function Navigation() {
  const { logout, customer } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/accounts', label: 'Accounts' },
    { path: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Banking App
            </Link>
            <div className="hidden md:flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Welcome, {customer?.first_name || 'User'}
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

// Dashboard - now fully functional
function Dashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Welcome to the Banking Microservices application.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/accounts"
            className="card hover:shadow-lg transition-shadow p-6 border border-primary-200"
          >
            <h3 className="text-lg font-semibold text-primary-700">My Accounts</h3>
            <p className="text-gray-600 text-sm mt-2">
              View and manage your checking and savings accounts
            </p>
          </Link>
          <Link
            to="/profile"
            className="card hover:shadow-lg transition-shadow p-6 border border-primary-200"
          >
            <h3 className="text-lg font-semibold text-primary-700">My Profile</h3>
            <p className="text-gray-600 text-sm mt-2">
              Update your personal information and settings
            </p>
          </Link>
          <Link
            to="/accounts"
            className="card hover:shadow-lg transition-shadow p-6 border border-primary-200"
          >
            <h3 className="text-lg font-semibold text-primary-700">Transactions</h3>
            <p className="text-gray-600 text-sm mt-2">
              View transaction history and make deposits/withdrawals
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Accounts />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts/:accountNumber"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AccountDetail />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts/:accountNumber/transactions"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Transactions />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Profile />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
