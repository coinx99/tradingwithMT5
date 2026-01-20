import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Card
} from 'antd';
import { ADMIN_UPDATE_USER_MUTATION } from '../graphql/user';
import { type User, UserRole, UserStatus } from '../types/user';
import { appContext } from '../context/App';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Option } = Select;

// Helper function to map server error messages to translation keys
const getErrorTranslationKey = (errorMessage: string): string => {
  if (errorMessage.includes('Only admin and super_admin')) {
    return 'users.onlyAdminCanUpdate';
  }
  if (errorMessage.includes('not authorized')) {
    return 'users.unauthorized';
  }
  if (errorMessage.includes('not found')) {
    return 'users.notFound';
  }
  // Default error message
  return 'users.updateError';
};

interface UserEditFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ user, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const [updateUser] = useMutation(ADMIN_UPDATE_USER_MUTATION, {
    onCompleted: () => {
      appContext.message?.success(t('users.updateSuccess'));
      setLoading(false);
      onSuccess?.();
    },
    onError: (error) => {
      // Map server error messages to translation keys
      const errorKey = getErrorTranslationKey(error.message);
      appContext.message?.error(t(errorKey));
      setLoading(false);
    }
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Send all fields including admin fields (roles, status)
      const allowedFields = {
        username: values.username,
        displayName: values.displayName,
        bio: values.bio,
        avatar: values.avatar,
        theme: values.theme,
        language: values.language,
        sellerDescription: values.sellerDescription,
        roles: values.roles,
        status: values.status
      };

      await updateUser({
        variables: {
          id: user.id,
          input: allowedFields
        }
      });
    } catch (err: any) {
      console.error('Update error:', err);
      const errorKey = getErrorTranslationKey(err.message || '');
      appContext.notification?.error({
        message: t('users.updateError'),
        description: t(errorKey),
      });
      setLoading(false);
    }
  };

  return (
    <Card title={t('users.editUserInformation')}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          theme: user.theme,
          language: user.language,
          sellerDescription: user.sellerDescription,
          roles: user.roles,
          status: user.status
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('users.username')}
          name="username"
          rules={[{ required: true, message: 'Please input username!' }]}
        >
          <Input placeholder={t('users.username')} />
        </Form.Item>

        <Form.Item
          label={t('users.displayName')}
          name="displayName"
        >
          <Input placeholder={t('users.displayName')} />
        </Form.Item>

        <Form.Item
          label={t('users.email')}
          name="email"
        >
          <Input placeholder={t('users.email')} disabled />
        </Form.Item>

        <Form.Item
          label={t('users.bio')}
          name="bio"
        >
          <TextArea rows={4} placeholder={t('users.bio')} />
        </Form.Item>

        <Form.Item
          label={t('users.avatarUrl')}
          name="avatar"
        >
          <Input placeholder={t('users.avatarUrl')} />
        </Form.Item>

        <Form.Item
          label={t('users.theme')}
          name="theme"
        >
          <Select placeholder={t('users.selectTheme')}>
            <Option value="light">{t('users.light')}</Option>
            <Option value="dark">{t('users.dark')}</Option>
            <Option value="auto">{t('users.auto')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('users.language')}
          name="language"
        >
          <Select placeholder={t('users.selectLanguage')}>
            <Option value="en">{t('users.english')}</Option>
            <Option value="vi">{t('users.vietnamese')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('users.roles')}
          name="roles"
          rules={[{ required: true, message: 'Please select at least one role!' }]}
        >
          <Select mode="multiple" placeholder={t('users.selectRoles')}>
            <Option value={UserRole.USER}>User</Option>
            <Option value={UserRole.SELLER}>Seller</Option>
            <Option value={UserRole.ADMIN}>Admin</Option>
            <Option value={UserRole.SUPER_ADMIN}>Super Admin</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('users.status')}
          name="status"
          rules={[{ required: true, message: 'Please select status!' }]}
        >
          <Select placeholder={t('users.selectStatus')}>
            <Option value={UserStatus.ACTIVE}>Active</Option>
            <Option value={UserStatus.INACTIVE}>Inactive</Option>
            <Option value={UserStatus.SUSPENDED}>Suspended</Option>
            <Option value={UserStatus.PENDING_VERIFICATION}>Pending Verification</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('users.sellerDescription')}
          name="sellerDescription"
        >
          <TextArea rows={3} placeholder={t('users.sellerDescription')} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('users.saveChanges')}
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                {t('users.cancel')}
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserEditForm;
