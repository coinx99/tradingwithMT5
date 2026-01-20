import React from 'react';
import { Card, Space, Tag, Button, Alert, Descriptions } from 'antd';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRole } from '../utils/roleHelpers';
import { useState } from 'react';
import { connectIcpWallet, isPlugAvailable, type IcpWalletInfo } from '../utils/icpWallet';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [icpInfo, setIcpInfo] = useState<IcpWalletInfo | null>(null);

  const handleConnectIcp = async () => {
    const info = await connectIcpWallet();
    setIcpInfo(info);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  // const testLogin = async () => {
  //   console.log('Testing login...');
  //   const { login } = require('../context/AuthContext');
  //   // This won't work here, just for demo
  // };

  return (
    <div style={{ padding: '24px' }}>
      <h2>Authentication Debug Page</h2>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* Current Auth State */}
        <Card title="Current Authentication State">
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Is Authenticated">
              <Tag color={isAuthenticated ? 'success' : 'error'}>
                {isAuthenticated ? '✅ YES' : '❌ NO'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loading">
              <Tag color={loading ? 'processing' : 'default'}>
                {loading ? '⏳ YES' : '✅ NO'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="User Object">
              <pre style={{ fontSize: '12px' }}>
                {user ? JSON.stringify(user, null, 2) : 'null'}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* ICP Wallet Debug */}
        <Card title="ICP Wallet (Plug) Debug">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="ICP Wallet Connection"
              description={
                <div>
                  <p>
                    <strong>Plug extension detected:</strong>{' '}
                    {isPlugAvailable() ? '✅ Yes' : '❌ No (install Plug wallet in browser)'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    This section only runs in the browser and helps inspect what information is
                    available from the ICP wallet (principal, etc.).
                  </p>
                </div>
              }
              type="info"
            />

            <Button onClick={handleConnectIcp} type="primary" disabled={!isPlugAvailable()}>
              {icpInfo?.connected ? 'Reconnect ICP Wallet' : 'Connect ICP Wallet'}
            </Button>

            {icpInfo && (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Connected">
                  <Tag color={icpInfo.connected ? 'success' : 'error'}>
                    {icpInfo.connected ? 'YES' : 'NO'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Principal (text)">
                  <pre style={{ fontSize: '12px', margin: 0 }}>
                    {icpInfo.principalText || 'N/A'}
                  </pre>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Space>
        </Card>

        {/* Role Check */}
        {user && (
          <Card title="Role Analysis">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>User Role:</strong> 
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  "{getPrimaryRole(user) || 'N/A'}"
                </Tag>
              </div>
              
              <div>
                <strong>Dashboard Access Check:</strong>
                <div style={{ marginTop: 8 }}>
                  <Tag color={['admin', 'moderator'].includes((getPrimaryRole(user) || '').toLowerCase()) ? 'success' : 'error'}>
                    {['admin', 'moderator'].includes((getPrimaryRole(user) || '').toLowerCase()) ? '✅ ALLOWED' : '❌ DENIED'}
                  </Tag>
                  <span style={{ marginLeft: 8, fontSize: '12px' }}>
                    (Checking if primary role "{getPrimaryRole(user) || 'N/A'}" is in ["admin", "moderator"])
                  </span>
                </div>
              </div>

              <div>
                <strong>Case Insensitive Check:</strong>
                <div style={{ marginTop: 8 }}>
                  <Tag color={['admin', 'moderator'].some(role => role.toLowerCase() === (getPrimaryRole(user) || '').toLowerCase()) ? 'success' : 'error'}>
                    {['admin', 'moderator'].some(role => role.toLowerCase() === (getPrimaryRole(user) || '').toLowerCase()) ? '✅ ALLOWED' : '❌ DENIED'}
                  </Tag>
                  <span style={{ marginLeft: 8, fontSize: '12px' }}>
                    (Case insensitive comparison)
                  </span>
                </div>
              </div>
            </Space>
          </Card>
        )}

        {/* LocalStorage Debug */}
        <Card title="LocalStorage Debug">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>Stored User:</strong>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', marginTop: '8px' }}>
                {localStorage.getItem('user') || 'null'}
              </pre>
            </div>
            
            <div>
              <strong>Stored Token:</strong>
              <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', marginTop: '8px' }}>
                {localStorage.getItem('token') || 'null'}
              </pre>
            </div>
            
            <Button danger onClick={clearLocalStorage}>
              Clear LocalStorage & Reload
            </Button>
          </Space>
        </Card>

        {/* Test Credentials */}
        <Card title="Test Credentials">
          <Alert
            message="Mock Login Credentials"
            description={
              <div>
                <p><strong>Admin:</strong> admin@example.com / admin123</p>
                <p><strong>Moderator:</strong> moderator@example.com / mod123</p>
                <p><strong>User:</strong> user@example.com / user123</p>
              </div>
            }
            type="info"
          />
        </Card>

        {/* Console Logs */}
        <Card title="Debug Actions">
          <Space>
            <Button 
              onClick={() => console.log('Current user:', user)}
              type="default"
            >
              Log User to Console
            </Button>
            
            <Button 
              onClick={() => console.log('LocalStorage user:', localStorage.getItem('user'))}
              type="default"
            >
              Log LocalStorage to Console
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default AuthDebug;