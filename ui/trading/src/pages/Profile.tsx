import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Switch,
  Select,
  Tabs,
  Layout,
  Flex
} from 'antd';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  UserOutlined,
  MailOutlined,
  CameraOutlined,
  BellOutlined,
  SecurityScanOutlined,
  SaveOutlined,
  LockOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRole, getUserDisplayName } from '../utils/roleHelpers';
import type { UploadProps, TabsProps } from 'antd';
import { appContext } from '../context/App';
import { useMutation } from '@apollo/client/react';
import { UPDATE_USER_MUTATION, CHANGE_PASSWORD_MUTATION } from '../graphql/user';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProfileFormData {
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  avatar?: string;
  theme?: string;
  language?: string;
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    securityAlerts: true,
    marketingEmails: false
  });

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'zh', name: '中文' },
    { code: 'ru', name: 'Русский' }
  ];

  const { message } = appContext

  const [updateUser] = useMutation(UPDATE_USER_MUTATION, {
    onCompleted: () => {
      message?.success(t('profile.updateSuccess'));
      setLoading(false);
      refreshUser(); // Refresh user data from server
    },
    onError: (error) => {
      message?.error(`${t('profile.updateError')}: ${error.message}`);
      setLoading(false);
    }
  });

  const [changePassword] = useMutation(CHANGE_PASSWORD_MUTATION, {
    onCompleted: () => {
      message?.success(t('profile.passwordChanged'));
      securityForm.resetFields();
      setLoading(false);
    },
    onError: (error) => {
      message?.error(`${t('profile.passwordChangeError')}: ${error.message}`);
      setLoading(false);
    }
  });

  const handleProfileUpdate = async (values: ProfileFormData) => {
    setLoading(true);
    try {
      // Build input object, excluding empty strings
      const input: any = {
        username: values.username,
        displayName: values.displayName,
      };

      // Only include optional fields if they have values
      if (values.email) input.email = values.email;
      if (values.bio) input.bio = values.bio;
      if (values.avatar && values.avatar.trim()) input.avatar = values.avatar;
      if (values.theme) input.theme = values.theme;
      if (values.language) input.language = values.language;

      await updateUser({
        variables: { input }
      });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handlePasswordChange = async (values: SecurityFormData) => {
    setLoading(true);
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
          }
        }
      });
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  const handleAvatarUpload: UploadProps['customRequest'] = async (_options) => {
    setUploading(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      message?.success(t('profile.avatarUpdated'));
    } catch (error) {
      message?.error(t('profile.avatarUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    message?.success(t('profile.notificationUpdated'));
  };

  const uploadButton = (
    <div className="flex flex-col items-center">
      <CameraOutlined className="text-2xl text-gray-400 mb-2" />
      <div className="text-sm text-gray-600">Upload Photo</div>
    </div>
  );

  const profileTabContent = (<Flex justify='center'>
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={8}>
        <Card>
          <div className="text-center">
            <Upload
              name="avatar"
              listType="picture-circle"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={handleAvatarUpload}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message?.error(t('profile.imageOnly'));
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message?.error(t('profile.imageTooLarge'));
                }
                return isImage && isLt2M;
              }}
            >
              {user?.avatar ? (
                <Avatar size={350} src={user.avatar} />
              ) : (
                <Avatar size={100} icon={<UserOutlined />} />
              )}
              {uploading ? null : uploadButton}
            </Upload>

            <Title level={4} className="mt-4 mb-2">
              {getUserDisplayName(user)}
            </Title>
            <Text type="secondary">{getPrimaryRole(user) || 'User'}</Text>
            <Paragraph className="mt-4 text-gray-600">
              {(user as any)?.bio || 'No bio available'}
            </Paragraph>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        <Card title={t('profile.personalInfo')} extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => profileForm.submit()}
            loading={loading}
          >
            {t('common.save')}
          </Button>
        }
          styles={{ body: { width: '100%' } }}
        >
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileUpdate}
            initialValues={{
              username: user?.username || '',
              displayName: user?.displayName || '',
              email: user?.email || '',
              bio: (user as any)?.bio || '',
              avatar: (user as any)?.avatar || '',
              theme: (user as any)?.theme || 'light',
              language: (user as any)?.language || 'en'
            }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={t('users.username')}
                  name="username"
                  rules={[{ required: true, message: t('profile.usernameRequired') }]}
                >
                  <Input prefix={<UserOutlined />} placeholder={t('users.username')} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={t('users.displayName')}
                  name="displayName"
                >
                  <Input prefix={<UserOutlined />} placeholder={t('users.displayName')} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={t('common.email')}
              name="email"
              rules={[
                { type: 'email', message: t('profile.emailInvalid') }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder={t('common.email')} 
              />
            </Form.Item>

            <Form.Item label={t('users.avatarUrl')} name="avatar">
              <Input placeholder={t('users.avatarUrl')} />
            </Form.Item>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label={t('users.theme')} name="theme">
                  <Select placeholder={t('users.selectTheme')}>
                    <Option value="light">{t('users.light')}</Option>
                    <Option value="dark">{t('users.dark')}</Option>
                    <Option value="auto">{t('users.auto')}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={t('users.language')} name="language">
                  <Select placeholder={t('users.selectLanguage')}>
                    <Option value="en">{t('users.english')}</Option>
                    <Option value="vi">{t('users.vietnamese')}</Option>
                    <Option value="zh">中文</Option>
                    <Option value="ru">Русский</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={t('profile.bio')} name="bio">
              <TextArea
                rows={4}
                placeholder={t('profile.bio')}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  </Flex>);

  const securityTabContent = (<Flex justify='center'>
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <Card
          title={t('profile.changePassword')}
          extra={<LockOutlined />}
        >
          <Form
            form={securityForm}
            layout="vertical"
            onFinish={handlePasswordChange}
          >
            <Form.Item
              label={t('profile.currentPassword')}
              name="currentPassword"
              rules={[{ required: true, message: 'Please input your current password!' }]}
            >
              <Input.Password placeholder={t('profile.currentPassword')} />
            </Form.Item>

            <Form.Item
              label={t('profile.newPassword')}
              name="newPassword"
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password placeholder={t('profile.newPassword')} />
            </Form.Item>

            <Form.Item
              label={t('profile.confirmPassword')}
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('profile.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('profile.passwordsNotMatch')));
                  },
                }),
              ]}
            >
              <Input.Password placeholder={t('profile.confirmPassword')} />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SecurityScanOutlined />}
              block
            >
              {t('profile.changePassword')}
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title={t('profile.languageRegion')} extra={<GlobalOutlined />}>
          <Space direction="vertical" className="w-full">
            <div>
              <Text strong>{t('users.language')}:</Text>
              <Select
                value={i18n.language}
                onChange={(value) => i18n.changeLanguage(value)}
                className="w-full mt-2"
              >
                {languages.map(lang => (
                  <Option key={lang.code} value={lang.code}>
                    {lang.name}
                  </Option>
                ))}
              </Select>
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  </Flex>);

  const notificationTabContent = (<Flex justify='center'>
    <Card title={t('profile.notifications')} extra={<BellOutlined />}>
      <Space direction="vertical" className="w-full" size="large">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>{t('profile.emailNotifications')}</Text>
            <div className="text-gray-500 text-sm">
              {t('profile.emailNotificationsDesc')}
            </div>
          </div>
          <Switch
            checked={notifications.emailNotifications}
            onChange={(checked) => handleNotificationChange('emailNotifications', checked)}
          />
        </div>

        <Divider />

        <div className="flex justify-between items-center">
          <div>
            <Text strong>{t('profile.pushNotifications')}</Text>
            <div className="text-gray-500 text-sm">
              {t('profile.pushNotificationsDesc')}
            </div>
          </div>
          <Switch
            checked={notifications.pushNotifications}
            onChange={(checked) => handleNotificationChange('pushNotifications', checked)}
          />
        </div>

        <Divider />

        <div className="flex justify-between items-center">
          <div>
            <Text strong>{t('profile.securityAlerts')}</Text>
            <div className="text-gray-500 text-sm">
              {t('profile.securityAlertsDesc')}
            </div>
          </div>
          <Switch
            checked={notifications.securityAlerts}
            onChange={(checked) => handleNotificationChange('securityAlerts', checked)}
          />
        </div>

        <Divider />

        <div className="flex justify-between items-center">
          <div>
            <Text strong>{t('profile.marketingEmails')}</Text>
            <div className="text-gray-500 text-sm">
              {t('profile.marketingEmailsDesc')}
            </div>
          </div>
          <Switch
            checked={notifications.marketingEmails}
            onChange={(checked) => handleNotificationChange('marketingEmails', checked)}
          />
        </div>
      </Space>
    </Card>
  </Flex>);

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined />
          {t('profile.personalInfo')}
        </span>
      ),
      children: profileTabContent,
    },
    {
      key: '2',
      label: (
        <span>
          <SecurityScanOutlined />
          {t('profile.security')}
        </span>
      ),
      children: securityTabContent,
    },
    {
      key: '3',
      label: (
        <span>
          <BellOutlined />
          {t('profile.notifications')}
        </span>
      ),
      children: notificationTabContent,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('profile.title')} - Dashboard App</title>
        <meta name="description" content="Manage your profile settings" />
      </Helmet>

      <Layout className="layout-responsive">
        <div>
          <Title level={2} className="mb-2">
            {t('profile.title')}
          </Title>
          <Paragraph className="text-gray-600 mb-0">
            {t('profile.subtitle')}
          </Paragraph>
        </div>

        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          size="large"
          className="profile-tabs"
        />
      </Layout>
    </>
  );
};

export default Profile;