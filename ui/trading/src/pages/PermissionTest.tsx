import React from 'react';
import { Card, Row, Col, Tag, Alert, Space, Button } from 'antd';
import { 
  UserOutlined, 
  CrownOutlined, 
  SafetyCertificateOutlined,
  LockOutlined 
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import AdminRoute from '../components/AdminRoute';
import { UserRole } from '../types/user';
import { hasAnyRole, getPrimaryRole, isAdmin } from '../utils/roleHelpers';
// import ProtectedRoute from '../components/ProtectedRoute';

const PermissionTest: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return <CrownOutlined style={{ color: '#ff4d4f' }} />;
      case UserRole.SELLER:
        return <SafetyCertificateOutlined style={{ color: '#1890ff' }} />;
      case UserRole.USER:
        return <UserOutlined style={{ color: '#52c41a' }} />;
      default:
        return <LockOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return 'red';
      case UserRole.SELLER:
        return 'blue';
      case UserRole.USER:
        return 'green';
      default:
        return 'default';
    }
  };

  const primaryRole = getPrimaryRole(user);

  return (
    <div style={{ padding: '24px' }}>
      <h2>Permission Testing Dashboard</h2>
      <p>This page helps test different permission levels in the application.</p>
      
      <Row gutter={[24, 24]}>
        {/* Current User Info */}
        <Col xs={24} md={12}>
          <Card title="Current User Info" size="small">
            {isAuthenticated ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Username:</strong> {user?.username || 'N/A'}
                </div>
                <div>
                  <strong>Email:</strong> {user?.email || 'N/A'}
                </div>
                <div>
                  <strong>Roles:</strong>{' '}
                  <Space>
                    {user?.roles?.map(role => (
                      <Tag key={role} icon={getRoleIcon(role)} color={getRoleColor(role)}>
                        {role.toUpperCase()}
                      </Tag>
                    )) || <Tag>NO ROLES</Tag>}
                  </Space>
                </div>
                <div>
                  <strong>Primary Role:</strong>{' '}
                  <Tag color={isAdmin(user) ? 'success' : 'warning'}>
                    {primaryRole || 'UNKNOWN'}
                  </Tag>
                </div>
              </Space>
            ) : (
              <Alert message="Not authenticated" type="warning" />
            )}
          </Card>
        </Col>

        {/* Permission Levels */}
        <Col xs={24} md={12}>
          <Card title="Permission Levels" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag icon={<CrownOutlined />} color="red">ADMIN</Tag>
                <span style={{ marginLeft: 8 }}>Full system access</span>
              </div>
              <div>
                <Tag icon={<SafetyCertificateOutlined />} color="blue">MODERATOR</Tag>
                <span style={{ marginLeft: 8 }}>Content management</span>
              </div>
              <div>
                <Tag icon={<UserOutlined />} color="green">USER</Tag>
                <span style={{ marginLeft: 8 }}>Basic access</span>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Dashboard Access Test */}
        <Col xs={24}>
          <Card title="Access Tests" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              
              {/* Test 1: Dashboard Access */}
              <Alert
                message="Dashboard Access"
                description={
                  <div>
                    <p><strong>Required:</strong> Admin or Seller role</p>
                    <p><strong>Your Access:</strong> {
                      hasAnyRole(user, [UserRole.ADMIN, UserRole.SELLER]) 
                        ? <Tag color="success">✅ ALLOWED</Tag>
                        : <Tag color="error">❌ DENIED</Tag>
                    }</p>
                    <p><em>This entire dashboard requires admin or seller privileges.</em></p>
                  </div>
                }
                type="info"
              />

              {/* Test 2: Job Management */}
              <Alert
                message="Job Management (Edit/Create)"
                description={
                  <div>
                    <p><strong>Required:</strong> Admin or Seller role</p>
                    <p><strong>Your Access:</strong> {
                      hasAnyRole(user, [UserRole.ADMIN, UserRole.SELLER]) 
                        ? <Tag color="success">✅ ALLOWED</Tag>
                        : <Tag color="error">❌ DENIED</Tag>
                    }</p>
                    <p><em>Can edit and create job postings.</em></p>
                  </div>
                }
                type="info"
              />

              {/* Test 3: Admin Only Features */}
              <Alert
                message="Admin-Only Features (Delete)"
                description={
                  <div>
                    <p><strong>Required:</strong> Admin role only</p>
                    <p><strong>Your Access:</strong> {
                      isAdmin(user)
                        ? <Tag color="success">✅ ALLOWED</Tag>
                        : <Tag color="error">❌ DENIED</Tag>
                    }</p>
                    <AdminRoute 
                      fallback={<p><em>Delete buttons and destructive actions are hidden.</em></p>}
                    >
                      <p><em>You can see delete buttons and perform destructive actions.</em></p>
                    </AdminRoute>
                  </div>
                }
                type="warning"
              />

            </Space>
          </Card>
        </Col>

        {/* Component Tests */}
        <Col xs={24}>
          <Card title="Component Protection Tests" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              
              <div>
                <h4>Admin-Only Button Test:</h4>
                <AdminRoute
                  fallback={<Button disabled>🔒 Admin Only Button (Hidden)</Button>}
                >
                  <Button type="primary" danger>🗑️ Delete Everything (Admin Only)</Button>
                </AdminRoute>
              </div>

              <div>
                <h4>Admin-Only Content Test:</h4>
                <AdminRoute
                  showFallback={true}
                >
                  <Alert
                    message="🎉 Admin Secret Content"
                    description="This content is only visible to administrators. You have the highest privileges!"
                    type="success"
                    showIcon
                  />
                </AdminRoute>
              </div>

            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PermissionTest;