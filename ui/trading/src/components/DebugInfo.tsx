import React, { useState, useEffect } from 'react';
import { Card, Tag, Collapse, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  LoadingOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useLazyQuery } from '@apollo/client/react';
import { PING_QUERY } from '../graphql/auth';
import type { PingQuery } from '../generated/graphql';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface DebugInfoProps {
  visible?: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ visible = true }) => {
  const [graphqlStatus, setGraphqlStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [apolloPingResult, setApolloPingResult] = useState<string | null>(null);
  
  // Apollo ping test with generated types
  const [executePing] = useLazyQuery<PingQuery>(PING_QUERY, {
    errorPolicy: 'all'
  });

  useEffect(() => {
    checkGraphQLConnection();
  }, []);

  const checkGraphQLConnection = async () => {
    setGraphqlStatus('checking');
    setApolloPingResult(null);
    
    console.log('🏓 Testing GraphQL connection...');
    
    try {
      // Test 1: Raw fetch test
      console.log('🥰 Test 1: Raw fetch to /api/graphql');
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '{ __typename }'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Raw fetch successful:', data);
        
        // Test 2: Apollo ping query
        console.log('🏓 Test 2: Apollo ping query');
        try {
          const pingResult = await executePing();
          console.log('✅ Apollo ping successful:', pingResult.data);
          setApolloPingResult(pingResult.data?.ping || 'Success but no ping data');
          setGraphqlStatus('connected');
        } catch (apolloError: any) {
          console.log('❌ Apollo ping failed:', apolloError);
          console.log('📜 Apollo error details:', {
            message: apolloError?.message,
            graphQLErrors: apolloError?.graphQLErrors,
            networkError: apolloError?.networkError
          });
          setApolloPingResult(`Apollo Error: ${apolloError?.message || 'Unknown error'}`);
          setGraphqlStatus('failed');
        }
      } else {
        console.log('❌ Raw fetch failed:', response.status, response.statusText);
        setGraphqlStatus('failed');
        setApolloPingResult(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.log('❌ Connection test failed:', error);
      setGraphqlStatus('failed');
      setApolloPingResult(`Network Error: ${error?.message || 'Unknown network error'}`);
    }
    setLastCheck(new Date());
  };

  if (!visible) return null;

  const getStatusIcon = () => {
    switch (graphqlStatus) {
      case 'checking':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'connected':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  const getStatusText = () => {
    switch (graphqlStatus) {
      case 'checking':
        return 'Checking connection...';
      case 'connected':
        return 'GraphQL Connected';
      case 'failed':
        return 'GraphQL Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (graphqlStatus) {
      case 'checking':
        return 'processing';
      case 'connected':
        return 'success';
      case 'failed':
        return 'error';
    }
  };

  return (
    <Card 
      size="small" 
      style={{ 
        position: 'fixed', 
        top: 80, 
        right: 20, 
        width: 300, 
        zIndex: 1000,
        opacity: 0.9
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InfoCircleOutlined />
          <Text strong>Debug Info</Text>
        </div>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <Tag 
          color={getStatusColor()} 
          icon={getStatusIcon()}
          style={{ marginBottom: 8 }}
        >
          {getStatusText()}
        </Tag>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Last check: {lastCheck.toLocaleTimeString()}
        </Text>
      </div>

      <Collapse size="small" ghost>
        <Panel 
          header={<Text style={{ fontSize: '12px' }}>Connection Details</Text>} 
          key="details"
        >
          <div style={{ fontSize: '11px' }}>
            <Paragraph style={{ margin: 0, fontSize: '11px' }}>
              <strong>GraphQL Endpoint:</strong><br />
              <code>/api/graphql</code>
            </Paragraph>
            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '11px' }}>
              <strong>Proxy Target:</strong><br />
              <code>http://localhost:84</code>
            </Paragraph>
            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '11px' }}>
              <strong>Status:</strong>{' '}
              {graphqlStatus === 'connected' ? (
                <Text type="success">✅ Ready for requests</Text>
              ) : graphqlStatus === 'failed' ? (
                <Text type="danger">❌ Using fallback mode</Text>
              ) : (
                <Text type="warning">🔄 Checking...</Text>
              )}
            </Paragraph>
            
            {apolloPingResult && (
              <Paragraph style={{ margin: '8px 0 0 0', fontSize: '11px' }}>
                <strong>Apollo Ping:</strong><br />
                <code style={{ fontSize: '10px', background: '#f6f6f6', padding: '2px 4px' }}>
                  {apolloPingResult}
                </code>
              </Paragraph>
            )}
          </div>
        </Panel>
        
        <Panel 
          header={<Text style={{ fontSize: '12px' }}>Console Logs</Text>} 
          key="logs"
        >
          <div style={{ fontSize: '11px' }}>
            <Text type="secondary">
              Open browser DevTools (F12) → Console tab to see detailed signup logs:
            </Text>
            <ul style={{ margin: '4px 0', paddingLeft: 16, fontSize: '10px' }}>
              <li>🚀 Starting signup process</li>
              <li>📝 Form data validation</li>
              <li>⚡ GraphQL mutation calls</li>
              <li>📨 Server responses</li>
              <li>❌/✅ Success/Error details</li>
            </ul>
          </div>
        </Panel>
      </Collapse>

      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <button 
          onClick={checkGraphQLConnection}
          style={{ 
            background: 'none', 
            border: '1px solid #d9d9d9', 
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          🔄 Recheck Connection
        </button>
      </div>
    </Card>
  );
};

export default DebugInfo;