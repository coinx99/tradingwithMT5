import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ConfigProvider, theme } from 'antd';
import './App.scss';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { apolloClient } from './graphql/client';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { UserRole } from './types/user';

// Pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
// User Management Pages
import UserList from './pages/users/UserList';
import UserDetail from './pages/users/UserDetail';
// Test Pages
import PermissionTest from './pages/PermissionTest';
import AuthDebug from './pages/AuthDebug';

// i18n
import './i18n/config';

// Styles
import './styles/index.scss';
import { ApolloProvider } from '@apollo/client/react';
import About from './pages/About';
import Contact from './pages/Contact';

// Ant Design theme configuration
const getAntdTheme = (isDark: boolean) => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 8,
    fontSize: 14,
    // Dark mode specific overrides
    ...(isDark && {
      colorBgContainer: '#141414',
      colorBgElevated: '#1f1f1f',
      colorBgLayout: '#000000',
      colorBorder: '#434343',
      colorText: '#ffffff',
      colorTextSecondary: '#a6a6a6',
    }),
  },
  components: {
    Button: {
      borderRadius: 8,
    },
    Card: {
      borderRadius: 12,
    },
    Input: {
      borderRadius: 8,
    },
    Layout: {
      headerBg: isDark ? '#141414' : '#ffffff',
      bodyBg: isDark ? '#000000' : '#f0f2f5',
      footerBg: isDark ? '#141414' : '#f0f2f5',
    },
    Menu: {
      itemBg: 'transparent',
      horizontalItemSelectedBg: 'transparent',
    },
  },
});

// App content component that uses theme
const AppContent: React.FC = () => {
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';

  return (
    <ConfigProvider theme={getAntdTheme(isDark)}>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              {/* Public routes with AppLayout */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                path="/home"
                element={
                  <AppLayout>
                    <Home />
                  </AppLayout>
                }
              />

              <Route
                path="/about"
                element={
                  <AppLayout>
                    <About />
                  </AppLayout>
                }
              />

              <Route
                path="/contact"
                element={
                  <AppLayout>
                    <Contact />
                  </AppLayout>
                }
              />

              {/* Auth routes - no layout */}
              <Route
                path="/signin"
                element={
                  <AppLayout>
                    <ProtectedRoute requireAuth={false}>
                      <SignIn />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/signup"
                element={
                  <AppLayout>
                    <ProtectedRoute requireAuth={false}>
                      <SignUp />
                    </ProtectedRoute>
                  </AppLayout>
                }
              />

              {/* Profile route with AppLayout */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard routes with DashboardLayout */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute 
                    requireRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SELLER]}
                    fallbackPath="/home"
                  >
                    <DashboardLayout>
                      <Routes>
                        {/* Dashboard home */}
                        <Route index element={<Dashboard />} />
                        
                        {/* User Management Routes */}
                        <Route path="users" element={<UserList />} />
                        <Route path="users/:userId" element={<UserDetail />} />
                        <Route path="users/:userId/edit" element={<UserDetail />} />
                        
                        {/* Test Routes */}
                        <Route path="permissions" element={<PermissionTest />} />

                        {/* Nested dashboard routes - placeholder for future implementation */}
                        <Route path="analytics/*" element={<div className="p-6"><h2>Analytics</h2><p>Coming soon...</p></div>} />
                        <Route path="content/*" element={<div className="p-6"><h2>Content Management</h2><p>Coming soon...</p></div>} />
                        <Route path="products" element={<div className="p-6"><h2>Products</h2><p>Coming soon...</p></div>} />
                        <Route path="orders" element={<div className="p-6"><h2>Orders</h2><p>Coming soon...</p></div>} />
                        <Route path="data/*" element={<div className="p-6"><h2>Data Management</h2><p>Coming soon...</p></div>} />
                        <Route path="security/*" element={<div className="p-6"><h2>Security</h2><p>Coming soon...</p></div>} />
                        <Route path="settings/*" element={<div className="p-6"><h2>Settings</h2><p>Coming soon...</p></div>} />

                        {/* Catch all for dashboard sub-routes */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Debug routes - accessible without auth for troubleshooting */}
              <Route 
                path="/debug/auth" 
                element={
                  <AppLayout>
                    <AuthDebug />
                  </AppLayout>
                } 
              />
              
              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ApolloProvider>
    </HelmetProvider>
  );
}

export default App;
