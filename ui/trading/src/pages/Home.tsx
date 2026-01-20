import React from 'react';
import { Button, Row, Col, Card, Typography, Space, Statistic, Badge, Layout, Flex } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  RocketOutlined,
  SecurityScanOutlined,
  DashboardOutlined,
  SafetyOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <SecurityScanOutlined className="text-4xl text-blue-500" />,
      title: t('home.features.security'),
      description: t('home.features.securityDesc'),
      color: 'blue'
    },
    {
      icon: <DashboardOutlined className="text-4xl text-green-500" />,
      title: t('home.features.dashboard'),
      description: t('home.features.dashboardDesc'),
      color: 'green'
    },
    {
      icon: <SafetyOutlined className="text-4xl text-purple-500" />,
      title: t('home.features.protection'),
      description: t('home.features.protectionDesc'),
      color: 'purple'
    }
  ];

  const stats = [
    { title: 'Active Users', value: 1234, prefix: <UserOutlined /> },
    { title: 'Total Projects', value: 56, prefix: <RocketOutlined /> },
    { title: 'Team Members', value: 12, prefix: <TeamOutlined /> },
    { title: 'Success Rate', value: 98.5, suffix: '%', prefix: <BarChartOutlined /> }
  ];

  return (
    <>
      <Helmet>
        <title>{t('home.title')} - Dashboard App</title>
        <meta name="description" content={t('home.subtitle')} />
      </Helmet>

      <Layout className="layout-responsive">
        {/* Hero Section */}
        <section>
          <Row align="middle">
            <Col xs={24} lg={12}>
              <Flex vertical>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8">
                  <Title level={1} className="text-white mb-4">
                    {t('home.title')}
                  </Title>
                  <Paragraph className="text-blue-100 text-lg mb-6">
                    {t('home.subtitle')}
                    {isAuthenticated && (
                      <Text className="block mt-2 text-yellow-200">
                        {t('home.loggedInMessage')}
                      </Text>
                    )}
                    {!isAuthenticated && (
                      <Text className="block mt-2 text-blue-200">
                        {t('home.notLoggedInMessage')}
                      </Text>
                    )}
                  </Paragraph>

                  <Space size="middle">
                    {isAuthenticated ? (
                      <>
                        <Button
                          type="primary"
                          size="large"
                          icon={<DashboardOutlined />}
                          className="bg-white text-blue-600 border-white hover:bg-blue-50"
                        >
                          <Link to="/dashboard">
                            {t('home.goToDashboard')}
                          </Link>
                        </Button>
                        <Button
                          size="large"
                          icon={<UserOutlined />}
                        >
                          <Link to="/profile">
                            {t('common.profile')}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="primary"
                          size="large"
                          icon={<RocketOutlined />}
                          className="bg-white text-blue-600 border-white hover:bg-blue-50"
                        >
                          <Link to="/signin">
                            {t('home.getStarted')}
                          </Link>
                        </Button>
                        <Button
                          size="large"
                          icon={<UserOutlined />}
                        >
                          <Link to="/signup">
                            {t('home.createAccount')}
                          </Link>
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              </Flex>
            </Col>
          </Row>
        </section>

        {/* Stats Section */}
        <section>
          <Row gutter={[12, 12]}>
            {stats.map((stat, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Features Section */}
        <section>
          <Flex vertical align='center' className='w-full'>
            <Title level={2} className="mb-4">
              {t('home.features.title')}
            </Title>
            <Paragraph className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover powerful features designed to enhance your workflow and productivity.
            </Paragraph>
          </Flex>

          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card
                  className="h-full text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Space direction="vertical" size="large" className="w-full">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <Title level={4} className="mb-2">
                        {feature.title}
                      </Title>
                      <Paragraph className="text-gray-600">
                        {feature.description}
                      </Paragraph>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Demo Accounts Section */}
        {!isAuthenticated && (
          <div className="bg-white">
            <div className="container mx-auto px-6 py-16">
              <div className="text-center mb-12">
                <Title level={2} className="mb-4">
                  {t('home.demo.title')}
                </Title>
                <Paragraph className="text-gray-600 text-lg">
                  Try our demo accounts to explore all features
                </Paragraph>
              </div>

              <Row gutter={[24, 24]} justify="center">
                <Col xs={24} md={12} lg={8}>
                  <Card
                    title={
                      <Space>
                        <UserOutlined className="text-red-500" />
                        {t('home.demo.admin')}
                      </Space>
                    }
                    className="hover:shadow-lg transition-shadow"
                    extra={<Badge count="Admin" style={{ backgroundColor: '#f50' }} />}
                  >
                    <Space direction="vertical" className="w-full">
                      <Text code>Email: admin@example.com</Text>
                      <Text code>Password: admin123</Text>
                      <Button
                        type="primary"
                        block
                        icon={<RightOutlined />}
                        className="mt-4"
                      >
                        <Link to="/signin">
                          {t('auth.signIn')}
                        </Link>
                      </Button>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={8}>
                  <Card
                    title={
                      <Space>
                        <UserOutlined className="text-blue-500" />
                        {t('home.demo.user')}
                      </Space>
                    }
                    className="hover:shadow-lg transition-shadow"
                    extra={<Badge count="User" style={{ backgroundColor: '#108ee9' }} />}
                  >
                    <Space direction="vertical" className="w-full">
                      <Text code>Email: user@example.com</Text>
                      <Text code>Password: user123</Text>
                      <Button
                        type="primary"
                        block
                        icon={<RightOutlined />}
                        className="mt-4"
                      >
                        <Link to="/signin">
                          {t('auth.signIn')}
                        </Link>
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        )}

        {/* Welcome Back Section for Authenticated Users */}
        {isAuthenticated && (
          <div className="bg-white">
            <div className="container mx-auto px-6 py-16">
              <Card className="text-center bg-gradient-to-r from-green-400 to-blue-500 text-white border-0">
                <Space direction="vertical" size="large">
                  <Title level={2} className="text-white mb-0">
                    {t('dashboard.welcomeBack', { name: user?.displayName })}
                  </Title>
                  <Paragraph className="text-green-100 text-lg mb-0">
                    Ready to continue where you left off?
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DashboardOutlined />}
                    className="bg-white text-blue-600 border-white hover:bg-blue-50"
                  >
                    <Link to="/dashboard">
                      {t('home.goToDashboard')}
                    </Link>
                  </Button>
                </Space>
              </Card>
            </div>
          </div>
        )}

      </Layout>
    </>
  );
};

export default Home;
