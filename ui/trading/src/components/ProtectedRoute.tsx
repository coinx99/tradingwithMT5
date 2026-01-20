import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';
import { hasAnyRole } from '../utils/roleHelpers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRoles?: UserRole[]; // Required roles to access this route
  fallbackPath?: string; // Where to redirect if user doesn't have required role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requireRoles = [],
  fallbackPath = '/home'
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // If user is authenticated but trying to access auth pages
  if (!requireAuth && isAuthenticated && 
      (location.pathname === '/signin' || location.pathname === '/signup')) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Show loading spinner while checking authentication - but NOT for auth pages when requireAuth=false
  // This prevents the loading spinner from showing when user clicks Sign in/Sign up buttons
  if (loading && !((!requireAuth) && (location.pathname === '/signin' || location.pathname === '/signup'))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to="/signin" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If roles are required, check if user has the required role
  if (requireAuth && isAuthenticated && requireRoles.length > 0) {
    // Role checking - check if user has any of the required roles
    const hasRequiredRole = hasAnyRole(user, requireRoles);
    
    if (!hasRequiredRole) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          width: '100%',
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
            <Result
              status="403"
              title="403"
              subTitle={t('errors.accessDenied', 'Sorry, you are not authorized to access this page.')}
              extra={
                <div style={{ marginTop: '20px' }}>
                  <p style={{ color: '#666', marginBottom: '8px' }}>
                    <strong>{t('errors.requiredRoles', 'Required role(s)')}:</strong>
                    {' '}
                    <span style={{ color: '#1890ff', fontWeight: 500 }}>
                      {requireRoles.join(', ').toUpperCase()}
                    </span>
                  </p>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    <strong>{t('errors.yourRoles', 'Your roles')}:</strong>
                    {' '}
                    <span style={{ fontWeight: 500 }}>
                      {user?.roles?.map(r => r.toUpperCase()).join(', ') || t('errors.noRole', 'NO ROLE ASSIGNED')}
                    </span>
                  </p>
                  <button 
                    onClick={() => window.location.href = fallbackPath}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1890ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#40a9ff'}
                    onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#1890ff'}
                  >
                    {t('common.goBack', 'Go Back')}
                  </button>
                </div>
              }
            />
          </div>
        </div>
      );
    }
  }

  // If authenticated and authorized, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
