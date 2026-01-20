import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useParams, Link } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Space, 
  Button, 
  Avatar,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  ArrowLeftOutlined,
  UserOutlined,
  WalletOutlined,
  ShoppingOutlined,
  StarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { GET_USER_QUERY } from '../../graphql/user';
import { type User, UserRole, UserStatus } from '../../types/user';
import UserEditForm from '../../components/UserEditForm';

const { Title } = Typography;

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslation();
  
  const { data, loading, error, refetch } = useQuery<{ user: User }>(GET_USER_QUERY, {
    variables: { id: userId },
    skip: !userId,
    errorPolicy: 'all',
    fetchPolicy: 'network-only'
  });

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    refetch(); // Refresh data without page reload
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message={t('errors.error')}
          description={error ? error.message : t('users.notFound')}
          type="error"
          showIcon
        />
        <div style={{ marginTop: '20px' }}>
          <Link to="/dashboard/users">
            <Button icon={<ArrowLeftOutlined />}>{t('users.backToUsers')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const user = data.user;

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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Link to="/dashboard/users">
            <Button icon={<ArrowLeftOutlined />}>{t('users.backToUsers')}</Button>
          </Link>
          <Title level={3} style={{ margin: 0 }}>{t('users.title')}</Title>
        </Space>
        <Button 
          type="primary" 
          icon={<EditOutlined />}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? t('users.viewMode') : t('users.editMode')}
        </Button>
      </div>

      {isEditing ? (
        <UserEditForm 
          user={user}
          onSuccess={handleUpdateSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <Avatar 
                src={user.avatar} 
                icon={<UserOutlined />}
                size={120}
              />
              <div>
                <Title level={4}>{user.displayName || user.username || 'No name'}</Title>
                <div style={{ color: '#888' }}>{user.email}</div>
                {user.username && (
                  <div style={{ color: '#888', fontSize: '12px' }}>@{user.username}</div>
                )}
              </div>
              <Space>
                {user.roles.map(role => (
                  <Tag key={role} color={getRoleColor(role)}>
                    {role.toUpperCase()}
                  </Tag>
                ))}
              </Space>
              <Tag color={getStatusColor(user.status)}>
                {user.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t('users.basicInformation')}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label={t('users.userId')}>{user.id}</Descriptions.Item>
                <Descriptions.Item label={t('users.email')}>{user.email}</Descriptions.Item>
                <Descriptions.Item label={t('users.username')}>{user.username || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label={t('users.displayName')}>{user.displayName || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label={t('users.emailVerified')} span={2}>
                  {user.isEmailVerified ? (
                    <Tag color="success">{t('users.verified')}</Tag>
                  ) : (
                    <Tag color="default">{t('users.notVerified')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('users.twoFactorEnabled')} span={2}>
                  {user.twoFactorEnabled ? (
                    <Tag color="blue">{t('users.enabled')}</Tag>
                  ) : (
                    <Tag color="default">{t('users.disabled')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('users.theme')}>{user.theme || 'Default'}</Descriptions.Item>
                <Descriptions.Item label={t('users.language')}>{user.language || 'en'}</Descriptions.Item>
                <Descriptions.Item label={t('users.bio')} span={2}>
                  {user.bio || 'No bio'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {user.isVerifiedSeller && (
              <Card title="Seller Statistics">
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic 
                      title="Total Sales" 
                      value={user.totalSales}
                      prefix={<ShoppingOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="Total Earnings" 
                      value={user.totalEarnings}
                      prefix="$"
                      precision={2}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="Rating" 
                      value={user.rating}
                      prefix={<StarOutlined />}
                      precision={1}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="Reviews" 
                      value={user.reviewCount}
                    />
                  </Col>
                </Row>
                {user.sellerDescription && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Description:</strong>
                    <p>{user.sellerDescription}</p>
                  </div>
                )}
              </Card>
            )}

            <Card title={<><WalletOutlined /> Wallets</>}>
              {user.walletAddresses.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {user.walletAddresses.map((wallet, index) => (
                    <div key={index}>
                      <code>{wallet}</code>
                      {wallet === user.primaryWallet && (
                        <Tag color="blue" style={{ marginLeft: '8px' }}>Primary</Tag>
                      )}
                    </div>
                  ))}
                </Space>
              ) : (
                <div style={{ color: '#888' }}>No wallets connected</div>
              )}
            </Card>

            <Card title="Metadata">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Created At">
                  {new Date(user.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {new Date(user.updatedAt).toLocaleString()}
                </Descriptions.Item>
                {user.lastLoginAt && (
                  <>
                    <Descriptions.Item label="Last Login">
                      {new Date(user.lastLoginAt).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Login IP">
                      {user.lastLoginIp || 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
                {user.stakedAmount > 0 && (
                  <>
                    <Descriptions.Item label="Staked Amount">
                      ${user.stakedAmount.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Staking Expiry">
                      {user.stakingExpiry ? new Date(user.stakingExpiry).toLocaleString() : 'N/A'}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </Card>
          </Space>
        </Col>
      </Row>
      )}
    </Space>
  );
};

export default UserDetail;
