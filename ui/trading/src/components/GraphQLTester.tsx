import React, { useState } from 'react';
import { Card, Button, Input, Alert, Typography } from 'antd';
import { PlayCircleOutlined, CopyOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;

const GraphQLTester: React.FC = () => {
  const [query, setQuery] = useState('{ ping }');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    console.log('🔥 Executing GraphQL query:', query);

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim()
        })
      });

      const data = await response.json();
      
      console.log('📨 GraphQL Response:', data);

      if (data.errors) {
        setError(JSON.stringify(data.errors, null, 2));
        console.log('❌ GraphQL Errors:', data.errors);
      } else {
        setResult(data.data);
        console.log('✅ GraphQL Success:', data.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.log('💥 Network Error:', err);
    }

    setLoading(false);
  };

  const testQueries = [
    {
      name: 'Ping Test',
      query: '{ ping }'
    },
    {
      name: 'Health Check',  
      query: '{ health }'
    },
    {
      name: 'CrawlJobs Query',
      query: `{
  crawlJobs {
    id
    title
    location
    content
    data
  }
}`
    },
    {
      name: 'Schema Types',
      query: '{ __schema { types { name } } }'
    },
    {
      name: 'Available Queries',
      query: `{
  __schema {
    queryType {
      fields {
        name
        description
        type {
          name
          kind
        }
      }
    }
  }
}`
    },
    {
      name: 'Available Mutations',
      query: `{
  __schema {
    mutationType {
      fields {
        name
        description
      }
    }
  }
}`
    }
  ];

  return (
    <Card 
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            🔧 GraphQL Tester
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Test connection to user service
          </Text>
        </div>
      }
      style={{ margin: '20px 0' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Quick Tests:</Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {testQueries.map((test) => (
            <Button
              key={test.name}
              size="small"
              onClick={() => setQuery(test.query)}
            >
              {test.name}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong>GraphQL Query:</Text>
        <TextArea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={6}
          style={{ marginTop: 8, fontFamily: 'monospace', fontSize: '12px' }}
          placeholder="Enter your GraphQL query..."
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={executeQuery}
          block
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message="GraphQL Error"
          description={
            <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
              {error}
            </pre>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {result && (
        <Alert
          type="success" 
          message="GraphQL Response"
          description={
            <div>
              <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                style={{ marginTop: 8 }}
              >
                Copy Result
              </Button>
            </div>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ fontSize: '11px', color: '#999' }}>
        <Text type="secondary">
          💡 Tips: Check browser DevTools Console for detailed logs. 
          Try the ping query first to test basic connectivity.
        </Text>
      </div>
    </Card>
  );
};

export default GraphQLTester;