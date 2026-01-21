import React, { useEffect } from 'react';
import { Layout, message, notification } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeOutlined,
  LoginOutlined,
  UserAddOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ContactsOutlined,
  InfoOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import AppFooter from '../components/AppFooter';
import type { MenuProps } from 'antd';
import AppHeader from '../components/AppHeader';
import { appContext } from '../context/App';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
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

  // User menu items when authenticated
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
      key: 'dashboard',
      label: (
        <Link to="/dashboard">
          <DashboardOutlined /> {t('common.dashboard')}
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

  // Auth navigation items
  const authItems: MenuProps['items'] = [
    {
      key: 'signin',
      label: (
        <Link to="/signin">
          <LoginOutlined /> {t('auth.signIn')}
        </Link>
      )
    },
    {
      key: 'signup',
      label: (
        <Link to="/signup">
          <UserAddOutlined /> {t('auth.signUp')}
        </Link>
      )
    }
  ];

  // Main navigation menu items
  const navItems: MenuProps['items'] = [
    {
      key: '/home',
      label: (
        <Link to="/home">
          <HomeOutlined /> {t('navigation.home')}
        </Link>
      )
    },
    {
      key: '/about',
      label: (
        <Link to="/about">
          <InfoOutlined /> {t('navigation.about')}
        </Link>
      )
    },
    {
      key: '/contact',
      label: (
        <Link to="/contact">
          <ContactsOutlined /> {t('navigation.contact')}
        </Link>
      )
    },
  ];

  return (
    <Layout className='layout-responsive'>
      <AppHeader
        navItems={navItems}
        languageItems={languageItems}
        user={user}
        isAuthenticated={isAuthenticated}
        userMenuItems={userMenuItems}
        authItems={authItems}
      />

      <Content className="flex-1">
        {children}
      </Content>

      <AppFooter />
      {contextHolder}
      {contextHolderNotification}

    </Layout>
  );
};

export default AppLayout;
