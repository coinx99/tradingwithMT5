import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Typography, Avatar, Badge, Breadcrumb, Flex, Grid, Drawer, message, notification } from 'antd';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  GlobalOutlined,
  HomeOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  TeamOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import type { MenuProps } from 'antd';
import { appContext } from '../context/App';
import { getUserDisplayName } from '../utils/roleHelpers';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications] = useState(0); // Mock notification count
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md; // md trở lên là desktop
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, contextHolderNotification] = notification.useNotification();

  useEffect(() => {
    appContext.message = messageApi;
  }, [messageApi]);

  useEffect(() => {
    appContext.notification = notificationApi;
  }, [notificationApi]);

  // Language menu items
  const languageItems: MenuProps['items'] = [
    {
      key: 'en',
      label: 'English',
      onClick: () => i18n.changeLanguage('en')
    },
    {
      key: 'vi',
      label: 'Tiếng Việt',
      onClick: () => i18n.changeLanguage('vi')
    },
    {
      key: 'zh',
      label: '中文',
      onClick: () => i18n.changeLanguage('zh')
    },
    {
      key: 'ru',
      label: 'Русский',
      onClick: () => i18n.changeLanguage('ru')
    }
  ];

  // User menu items
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Link to="/profile">
          <UserOutlined /> {t('common.profile')}
        </Link>
      )
    },
    {
      key: 'settings',
      label: (
        <Link to="/dashboard/settings">
          <SettingOutlined /> {t('profile.accountSettings')}
        </Link>
      )
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: (
        <span onClick={logout}>
          <LogoutOutlined /> {t('common.logout')}
        </span>
      )
    }
  ];

  // Sidebar menu items
  const sidebarItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">{t('navigation.home')}</Link>
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">{t('dashboard.title')}</Link>
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'User Management',
      children: [
        {
          key: '/dashboard/users',
          label: <Link to="/dashboard/users">All Users</Link>
        }
      ]
    },
    {
      key: 'help-tickets',
      icon: <QuestionCircleOutlined />,
      label: 'Help Tickets',
      children: [
        {
          key: '/dashboard/help-tickets',
          label: <Link to="/dashboard/help-tickets">All Tickets</Link>
        }
      ]
    },
    // {
    //   key: 'analytics',
    //   icon: <BarChartOutlined />,
    //   label: t('dashboard.actions.viewStats'),
    //   children: [
    //     {
    //       key: '/dashboard/analytics/overview',
    //       label: <Link to="/dashboard/analytics/overview">Overview</Link>
    //     },
    //     {
    //       key: '/dashboard/analytics/reports',
    //       label: <Link to="/dashboard/analytics/reports">Reports</Link>
    //     }
    //   ]
    // },
    // {
    //   key: 'users',
    //   icon: <TeamOutlined />,
    //   label: 'User Management',
    //   children: [
    //     {
    //       key: '/dashboard/users',
    //       label: <Link to="/dashboard/users">All Users</Link>
    //     },
    //     {
    //       key: '/dashboard/users/roles',
    //       label: <Link to="/dashboard/users/roles">Roles & Permissions</Link>
    //     }
    //   ]
    // },
    // {
    //   key: 'content',
    //   icon: <FileTextOutlined />,
    //   label: 'Content Management',
    //   children: [
    //     {
    //       key: '/dashboard/content/posts',
    //       label: <Link to="/dashboard/content/posts">Posts</Link>
    //     },
    //     {
    //       key: '/dashboard/content/pages',
    //       label: <Link to="/dashboard/content/pages">Pages</Link>
    //     }
    //   ]
    // },
    // {
    //   key: 'ecommerce',
    //   icon: <ShopOutlined />,
    //   label: 'E-commerce',
    //   children: [
    //     {
    //       key: '/dashboard/products',
    //       label: <Link to="/dashboard/products">Products</Link>
    //     },
    //     {
    //       key: '/dashboard/orders',
    //       label: <Link to="/dashboard/orders">Orders</Link>
    //     }
    //   ]
    // },
    // {
    //   key: 'data',
    //   icon: <DatabaseOutlined />,
    //   label: 'Data Management',
    //   children: [
    //     {
    //       key: '/dashboard/data/import',
    //       label: <Link to="/dashboard/data/import">Import Data</Link>
    //     },
    //     {
    //       key: '/dashboard/data/export',
    //       label: <Link to="/dashboard/data/export">Export Data</Link>
    //     }
    //   ]
    // },
    // {
    //   key: 'security',
    //   icon: <SecurityScanOutlined />,
    //   label: 'Security',
    //   children: [
    //     {
    //       key: '/dashboard/security/logs',
    //       label: <Link to="/dashboard/security/logs">Security Logs</Link>
    //     },
    //     {
    //       key: '/dashboard/security/settings',
    //       label: <Link to="/dashboard/security/settings">Security Settings</Link>
    //     }
    //   ]
    // },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: 'Settings',
    //   children: [
    //     {
    //       key: '/dashboard/settings/general',
    //       label: <Link to="/dashboard/settings/general">General</Link>
    //     },
    //     {
    //       key: '/dashboard/settings/integrations',
    //       label: <Link to="/dashboard/settings/integrations">Integrations</Link>
    //     }
    //   ]
    // }
  ];

  // Get current selected keys based on pathname
  const getSelectedKeys = () => {
    const { pathname } = location;
    if (pathname === '/dashboard') return ['/dashboard'];

    // Find exact match first
    const exactMatch = sidebarItems?.find(item => item?.key === pathname);
    if (exactMatch) return [pathname];

    // Find in children (exact match)
    for (const item of sidebarItems || []) {
      if (item && 'children' in item && item.children) {
        const childMatch = item.children.find((child: any) => child?.key === pathname);
        if (childMatch) return [pathname];
      }
    }

    // Find partial match (e.g., /dashboard/users/123 matches /dashboard/users)
    let bestMatch = '';
    for (const item of sidebarItems || []) {
      if (item && 'children' in item && item.children) {
        for (const child of item.children) {
          const childKey = (child as any)?.key;
          if (childKey && pathname.startsWith(childKey) && childKey.length > bestMatch.length) {
            bestMatch = childKey;
          }
        }
      }
    }

    if (bestMatch) return [bestMatch];

    return ['/dashboard'];
  };

  // Get breadcrumb items
  const getBreadcrumbItems = () => {
    const { pathname } = location;
    const paths = pathname.split('/').filter(Boolean);

    const breadcrumbItems = [
      {
        title: <Link to="/home"><HomeOutlined /></Link>
      }
    ];

    if (paths.length > 1) {
      breadcrumbItems.push({
        title: <Link to="/dashboard">{t('dashboard.title')}</Link>
      });

      // Build breadcrumb for nested paths
      if (paths.length > 2) {
        // Special handling for user management routes
        if (paths[1] === 'users') {
          breadcrumbItems.push({
            title: <Link to="/dashboard/users">{t('users.title')}</Link>
          });

          // If there's a user ID (detail page)
          if (paths.length > 2 && paths[2]) {
            breadcrumbItems.push({
              title: <span>{t('users.details')}</span>
            });
          }
        } else {
          // Generic handling for other routes
          for (let i = 2; i < paths.length; i++) {
            const path = '/' + paths.slice(0, i + 1).join('/');
            const isLast = i === paths.length - 1;
            const label = paths[i].charAt(0).toUpperCase() + paths[i].slice(1);

            if (isLast) {
              breadcrumbItems.push({
                title: <span>{label}</span>
              });
            } else {
              breadcrumbItems.push({
                title: <Link to={path}>{label}</Link>
              });
            }
          }
        }
      }
    } else {
      breadcrumbItems.push({
        title: <span>{t('dashboard.title')}</span>
      });
    }

    return breadcrumbItems;
  };

  return (
    <Layout>
      {!isMobile && (<Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        theme={theme}
        style={{ marginTop: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={sidebarItems}
          inlineCollapsed={collapsed}
        />

        <Button icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />} onClick={() => setCollapsed(prev => !prev)} />
      </Sider>)}

      {/* Drawer cho mobile */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setCollapsed(false)}
          open={collapsed}
          maskClosable
          style={{ maxWidth: '80%' }}
        >
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            items={sidebarItems}
          />

          <Button icon={<DoubleLeftOutlined />} onClick={() => setCollapsed(false)} />
        </Drawer>
      )}

      <Flex vertical>
        <Header style={{ padding: `0 ${isMobile ? 0 : 24}px`, display: 'flex', alignItems: 'center', }}>
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            {/* Left section */}
            <Flex gap="small" align="center">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
              <Breadcrumb items={getBreadcrumbItems()} />
            </Flex>

            {/* Right section */}
            <Flex align="center">
              <ThemeToggle />

              <Dropdown menu={{ items: languageItems }} placement="bottomRight" trigger={['click']}>
                <Button type="text" icon={<GlobalOutlined />}>
                  {i18n.language.toUpperCase()}
                </Button>
              </Dropdown>

              <Badge count={notifications} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['hover']}>
                <Flex align="center" gap="small" style={{ cursor: 'pointer' }}>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    src={user?.avatar}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                  <Text strong className="text-sm">
                    {getUserDisplayName(user)}
                  </Text>
                </Flex>
              </Dropdown>
            </Flex>
          </Flex>
        </Header>

        <Content className='layout-responsive' style={{ overflowX: 'scroll' }}>
          {children || <Outlet />}
        </Content>
      </Flex>

      {contextHolder}
      {contextHolderNotification}

    </Layout>
  );
};

export default DashboardLayout;
