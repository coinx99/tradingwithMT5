import React from 'react';
import { Result } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { isAdmin as checkIsAdmin } from '../utils/roleHelpers';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback,
  showFallback = false
}) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  // Check if user is admin or super_admin
  const isAdmin = isAuthenticated && checkIsAdmin(user);

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <div className="flex items-center justify-center p-8">
          <Result
            status="warning"
            title={t('errors.adminRequired', 'Admin Access Required')}
            subTitle={t('errors.adminRequiredMessage', 'This feature requires administrator privileges.')}
            extra={
              <div className="text-sm text-gray-600">
                <p>{t('errors.yourRoles', 'Your roles')}: <span className="font-medium">{user?.roles?.join(', ') || 'User'}</span></p>
                <p>{t('errors.requiredRole', 'Required role')}: <span className="font-medium text-red-600">Admin or Super Admin</span></p>
              </div>
            }
          />
        </div>
      );
    }
    
    // Don't render anything if user is not admin and no fallback is provided
    return null;
  }

  // If admin, render the protected component
  return <>{children}</>;
};

export default AdminRoute;