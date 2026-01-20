import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Timeline,
  List,
  Button,
  Progress,
  Avatar,
  Space,
  Tag,
  Alert
} from 'antd';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  UserOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TrophyOutlined,
  RocketOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRole, getUserDisplayName } from '../utils/roleHelpers';

const { Title, Text, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const stats = [
    {
      title: t('dashboard.stats.totalProjects'),
      value: 12,
      prefix: <ProjectOutlined />,
      suffix: 'projects',
      color: '#1890ff'
    },
    {
      title: t('dashboard.stats.completedTasks'),
      value: 85,
      prefix: <CheckCircleOutlined />,
      suffix: '%',
      color: '#52c41a'
    },
    {
      title: t('dashboard.stats.teamMembers'),
      value: 8,
      prefix: <TeamOutlined />,
      suffix: 'members',
      color: '#722ed1'
    },
    {
      title: t('dashboard.stats.newMessages'),
      value: 23,
      prefix: <MessageOutlined />,
      suffix: 'messages',
      color: '#fa541c'
    }
  ];

  const recentActivities = [
    {
      time: '2 hours ago',
      title: t('dashboard.activities.completedTask'),
      description: 'Frontend development milestone reached',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      type: 'success'
    },
    {
      time: '4 hours ago',
      title: t('dashboard.activities.joinedMeeting'),
      description: 'Weekly team standup meeting',
      icon: <TeamOutlined style={{ color: '#1890ff' }} />,
      type: 'info'
    },
    {
      time: '6 hours ago',
      title: t('dashboard.activities.updatedReport'),
      description: 'Monthly progress report updated',
      icon: <FileTextOutlined style={{ color: '#fa8c16' }} />,
      type: 'warning'
    },
    {
      time: '1 day ago',
      title: t('dashboard.activities.createdProject'),
      description: 'New e-commerce project initialized',
      icon: <RocketOutlined style={{ color: '#722ed1' }} />,
      type: 'default'
    }
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: t('dashboard.tasks.reviewCode'),
      deadline: 'Today, 15:00',
      priority: 'high',
      progress: 80,
      assignee: 'John Doe'
    },
    {
      id: 2,
      title: t('dashboard.tasks.weeklyReport'),
      deadline: 'Tomorrow, 10:00',
      priority: 'medium',
      progress: 45,
      assignee: 'Jane Smith'
    },
    {
      id: 3,
      title: t('dashboard.tasks.clientMeeting'),
      deadline: 'Sep 25, 14:00',
      priority: 'high',
      progress: 100,
      assignee: 'Mike Johnson'
    },
    {
      id: 4,
      title: t('dashboard.tasks.testFeature'),
      deadline: 'Sep 26, 16:00',
      priority: 'low',
      progress: 20,
      assignee: 'Sarah Wilson'
    }
  ];

  const quickActions = [
    {
      title: t('dashboard.actions.newProject'),
      icon: <PlusOutlined />,
      color: '#1890ff',
      onClick: () => {}
    },
    {
      title: t('dashboard.actions.writeReport'),
      icon: <FileTextOutlined />,
      color: '#52c41a',
      onClick: () => {}
    },
    {
      title: t('dashboard.actions.inviteMembers'),
      icon: <TeamOutlined />,
      color: '#722ed1',
      onClick: () => {}
    },
    {
      title: t('dashboard.actions.viewStats'),
      icon: <BarChartOutlined />,
      color: '#fa541c',
      onClick: () => {}
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - Dashboard App</title>
        <meta name="description" content="Dashboard overview with statistics and activities" />
      </Helmet>

      <div className="p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <Title level={2} className="mb-2">
            {t('dashboard.welcomeBack', { name: getUserDisplayName(user) })}
          </Title>
          <Paragraph className="text-gray-600 mb-4">
            Here's what's happening with your projects today.
          </Paragraph>
          <Alert
            message="🎉 Congratulations!"
            description="You've completed 85% of your tasks this week. Keep up the great work!"
            type="success"
            showIcon
            className="mb-6"
          />
        </div>

        {/* Stats Cards */}
        <Row gutter={[24, 24]} className="mb-8">
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="hover:shadow-lg transition-shadow">
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]}>
          {/* Recent Activities */}
          <Col xs={24} lg={12}>
            <Card 
              title={t('dashboard.recentActivities')}
              extra={<Button type="link">View All</Button>}
              className="h-full"
            >
              <Timeline
                items={recentActivities.map(activity => ({
                  dot: activity.icon,
                  children: (
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-gray-600 text-sm">{activity.description}</div>
                      <div className="text-gray-400 text-xs mt-1">{activity.time}</div>
                    </div>
                  )
                }))}
              />
            </Card>
          </Col>

          {/* Upcoming Tasks */}
          <Col xs={24} lg={12}>
            <Card 
              title={t('dashboard.upcomingTasks')}
              extra={<Button type="link">View All</Button>}
              className="h-full"
            >
              <List
                dataSource={upcomingTasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                          size="small"
                        >
                          {task.assignee.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{task.title}</span>
                          <Tag color={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div className="text-gray-600 text-sm mb-2">
                            <ClockCircleOutlined className="mr-1" />
                            {task.deadline}
                          </div>
                          <Progress 
                            percent={task.progress} 
                            size="small" 
                            status={task.progress === 100 ? 'success' : 'active'}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title={t('dashboard.quickActions')} className="mt-6">
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={action.icon}
                  onClick={action.onClick}
                  className="h-20 flex flex-col items-center justify-center hover:shadow-md transition-all"
                  style={{ borderColor: action.color }}
                >
                  <div style={{ color: action.color }} className="mt-2">
                    {action.title}
                  </div>
                </Button>
              </Col>
            ))}
          </Row>
        </Card>

        {/* User Info Card */}
        <Card 
          title={t('dashboard.userInfo')} 
          extra={<Button type="link" href="/profile">Edit Profile</Button>}
          className="mt-6"
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <div className="text-center">
                <Avatar 
                  size={80} 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                />
                <Title level={4} className="mt-4 mb-0">
                  {getUserDisplayName(user)}
                </Title>
                <Text type="secondary">{getPrimaryRole(user) || 'User'}</Text>
              </div>
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small">
                    <Text strong>Account Information</Text>
                    <div>
                      <Text type="secondary">Email: </Text>
                      <Text>{user?.email}</Text>
                    </div>
                    <div>
                      <Text type="secondary">ID: </Text>
                      <Text code>{user?.id}</Text>
                    </div>
                    <div>
                      <Text type="secondary">{t('dashboard.status')}: </Text>
                      <Tag color="green">{t('dashboard.active')}</Tag>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space direction="vertical" size="small">
                    <Text strong>Quick Stats</Text>
                    <div>
                      <TrophyOutlined className="mr-2 text-yellow-500" />
                      <Text>12 Projects Completed</Text>
                    </div>
                    <div>
                      <BugOutlined className="mr-2 text-red-500" />
                      <Text>3 Issues Resolved</Text>
                    </div>
                    <div>
                      <TeamOutlined className="mr-2 text-blue-500" />
                      <Text>8 Team Collaborations</Text>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
