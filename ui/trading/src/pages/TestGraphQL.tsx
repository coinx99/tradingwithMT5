import React from 'react';
import { Card, Typography } from 'antd';
import GraphQLTester from '../components/GraphQLTester';

const { Title } = Typography;

const TestGraphQL: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>GraphQL Connection Test</Title>
      <Card>
        <p>Use this tester to debug GraphQL connection and test crawlJobs query:</p>
        <ol>
          <li>First, test the "Ping Test" to check basic connectivity</li>
          <li>Then try "Available Queries" to see what queries are available</li>
          <li>Finally, test the "CrawlJobs Query" to see if it works</li>
        </ol>
      </Card>
      <GraphQLTester />
    </div>
  );
};

export default TestGraphQL;