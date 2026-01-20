import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { 
  Table, 
  Card, 
  Tag, 
  Space, 
  Button, 
  Input,
  Typography,
  Avatar,
  Tooltip,
  Badge,
  Alert
} from 'antd';
import {
  UserOutlined, 
  SearchOutlined,
  ReloadOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { GET_USERS_QUERY } from '../../graphql/user';
import { type User, UserRole, UserStatus } from '../../types/user';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

const UserList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, loading, error, refetch } = useQuery<{ users: User[] }>(GET_USERS_QUERY, {
    variables: {
      limit: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    },
    errorPolicy: 'all',
    fetchPolicy: 'network-only'
  });

  const users = data?.users || [];

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'red',
      [UserRole.ADMIN]: 'orange',
      [UserRole.SELLER]: 'blue',
      [UserRole.USER]: 'default'
    };
    return colors[role] || 'default';
  };

  const getStatusColor = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'success',
      [UserStatus.INACTIVE]: 'default',
      [UserStatus.SUSPENDED]: 'error',
      [UserStatus.PENDING_VERIFICATION]: 'warning'
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            size="large"
          />
          <div>
            <div>
              <Link to={`/dashboard/users/${record.id}`}>
                <strong>{record.displayName || record.username || 'No name'}</strong>
              </Link>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        const search = value.toString().toLowerCase();
        return (
          record.email.toLowerCase().includes(search) ||
          record.username?.toLowerCase().includes(search) ||
          record.displayName?.toLowerCase().includes(search) ||
          false
        );
      }
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles: UserRole[]) => (
        <>
          {roles.map(role => (
            <Tag key={role} color={getRoleColor(role)}>
              {role.toUpperCase()}
            </Tag>
          ))}
        </>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: UserStatus) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Verification',
      key: 'verification',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tooltip title={record.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}>
            {record.isEmailVerified ? (
              <Tag icon={<CheckCircleOutlined />} color="success">Email</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">Email</Tag>
            )}
          </Tooltip>
          {record.twoFactorEnabled && (
            <Tag color="blue">2FA</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Wallets',
      key: 'wallets',
      width: 100,
      render: (_, record) => (
        <Tooltip title={`${record.walletAddresses.length} wallet(s) connected`}>
          <Badge count={record.walletAddresses.length} showZero>
            <WalletOutlined style={{ fontSize: '20px' }} />
          </Badge>
        </Tooltip>
      )
    },
    {
      title: 'Seller Stats',
      key: 'seller',
      width: 150,
      render: (_, record) => (
        record.isVerifiedSeller ? (
          <Space direction="vertical" size="small">
            <div>Sales: {record.totalSales}</div>
            <div>Rating: {record.rating.toFixed(1)} ⭐</div>
          </Space>
        ) : (
          <span style={{ color: '#888' }}>Not a seller</span>
        )
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: Date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Link to={`/dashboard/users/${record.id}`}>
            <Button type="link" size="small">View</Button>
          </Link>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>Users</Title>
          <Space>
            <Search
              placeholder="Search users..."
              allowClear
              onSearch={setSearchText}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error loading users"
            description={error.message}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total: users.length,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`
          }}
          onChange={(newPagination) => {
            setPagination({
              current: newPagination.current || 1,
              pageSize: newPagination.pageSize || 10
            });
          }}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
};

export default UserList;
