import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  List,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Badge,
  Alert,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LoginOutlined,
  KeyOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { SavedAccount, SaveAccountInput, UpdateAccountInput } from '../types/mt5Account';
import { appContext } from '../context/App';
import { 
  SAVED_MT5_ACCOUNTS_QUERY, 
  SAVE_MT5_ACCOUNT_MUTATION, 
  UPDATE_SAVED_ACCOUNT_MUTATION, 
  DELETE_SAVED_ACCOUNT_MUTATION,
  CONNECT_SAVED_ACCOUNT_MUTATION 
} from '../graphql/mt5Account';
import { useQuery, useMutation } from '@apollo/client/react';

const { Title, Text } = Typography;

interface AccountManagementModalProps {
  visible: boolean;
  onCancel: () => void;
  onConnect: (accountId: string) => void;
  onSaved: () => void;
  loading?: boolean;
}

const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  visible,
  onCancel,
  onConnect,
  onSaved,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [editingAccount, setEditingAccount] = useState<SavedAccount | null>(null);
  const [form] = Form.useForm<SaveAccountInput>();
  const [editForm] = Form.useForm<UpdateAccountInput>();

  // GraphQL queries and mutations
  const { data: savedAccountsData, loading: accountsLoading, refetch: refetchAccounts } = useQuery<{ savedMt5Accounts: SavedAccount[] }>(SAVED_MT5_ACCOUNTS_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const [saveAccount] = useMutation(SAVE_MT5_ACCOUNT_MUTATION);
  const [updateAccount] = useMutation(UPDATE_SAVED_ACCOUNT_MUTATION);
  const [deleteAccount] = useMutation(DELETE_SAVED_ACCOUNT_MUTATION);
  const [connectSavedAccount] = useMutation(CONNECT_SAVED_ACCOUNT_MUTATION);

  const accountList = savedAccountsData?.savedMt5Accounts || [];

  // Reset form when switching tabs
  const handleTabChange = (tab: 'list' | 'add') => {
    setActiveTab(tab);
    setEditingAccount(null);
    form.resetFields();
    editForm.resetFields();
  };

  const handleEdit = (account: SavedAccount) => {
    setEditingAccount(account);
    editForm.setFieldsValue({
      account_id: account.id,
      path: account.path,
    });
    setActiveTab('add');
  };

  const handleSave = async () => {
    try {
      if (editingAccount) {
        // Update existing account
        const values = await editForm.validateFields();
        const result = await updateAccount({
          variables: { account: values }
        });
        
        if (result.data?.updateSavedAccount?.status === 'SUCCESS') {
          appContext.notification?.success({
            message: 'Account updated successfully',
            description: result.data.updateSavedAccount.message,
          });
          await refetchAccounts();
        } else {
          throw new Error(result.data?.updateSavedAccount?.message || 'Update failed');
        }
      } else {
        // Save new account
        const values = await form.validateFields();
        const result = await saveAccount({
          variables: { account: values }
        });
        
        if (result.data?.saveMt5Account?.status === 'SUCCESS') {
          appContext.notification?.success({
            message: 'Account saved successfully',
            description: result.data.saveMt5Account.message,
          });
          await refetchAccounts();
        } else {
          throw new Error(result.data?.saveMt5Account?.message || 'Save failed');
        }
      }
      
      onSaved();
      handleTabChange('list');
      form.resetFields();
      editForm.resetFields();
      setEditingAccount(null);
    } catch (error: any) {
      console.error('Save/Update failed:', error);
      appContext.notification?.error({
        message: 'Operation failed',
        description: error.message || 'An error occurred while saving the account.',
      });
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      const result = await deleteAccount({
        variables: { accountId }
      });
      
      if (result.data?.deleteSavedAccount?.status === 'SUCCESS') {
        appContext.notification?.success({
          message: 'Account deleted successfully',
          description: result.data.deleteSavedAccount.message,
        });
        await refetchAccounts();
        onSaved();
      } else {
        throw new Error(result.data?.deleteSavedAccount?.message || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Delete failed:', error);
      appContext.notification?.error({
        message: 'Delete failed',
        description: error.message || 'An error occurred while deleting the account.',
      });
    }
  };

  const handleConnectAccount = async (accountId: string) => {
    try {
      const result = await connectSavedAccount({
        variables: { accountId }
      });
      
      if (result.data?.connectSavedAccount?.status === 'SUCCESS') {
        appContext.notification?.success({
          message: 'Account connected successfully',
          description: result.data.connectSavedAccount.message,
        });
        await refetchAccounts();
        onConnect(accountId);
      } else {
        throw new Error(result.data?.connectSavedAccount?.message || 'Connect failed');
      }
    } catch (error: any) {
      console.error('Connect failed:', error);
      appContext.notification?.error({
        message: 'Connect failed',
        description: error.message || 'An error occurred while connecting to the account.',
      });
    }
  };

  const getLastConnectedDisplay = (lastConnected?: string) => {
    if (!lastConnected) return 'Never';
    const date = new Date(lastConnected);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined />
          <span>MT5 Account Management</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <Button
            type={activeTab === 'list' ? 'primary' : 'default'}
            onClick={() => handleTabChange('list')}
          >
            Saved Accounts
          </Button>
          <Button
            type={activeTab === 'add' ? 'primary' : 'default'}
            onClick={() => handleTabChange('add')}
          >
            {editingAccount ? 'Edit Account' : 'Add New Account'}
          </Button>
        </Space>
      </div>

      {activeTab === 'list' && (
        <>
          {accountsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading accounts...</div>
            </div>
          ) : (
            <List
          dataSource={accountList}
          renderItem={(account) => (
            <List.Item
              actions={[
                <Tooltip title="Connect to this account">
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={() => handleConnectAccount(account.id)}
                    disabled={account.isActive}
                    loading={loading && account.isActive}
                  >
                    {account.isActive ? 'Connected' : 'Connect'}
                  </Button>
                </Tooltip>,
                <Tooltip title="Edit account details">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(account)}
                    disabled={account.isActive}
                  >
                    Edit
                  </Button>
                </Tooltip>,
                <Tooltip title="Delete this account">
                  <Popconfirm
                    title="Delete Account?"
                    description={`Are you sure you want to delete account ${account.login}?`}
                    onConfirm={() => handleDelete(account.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      disabled={account.isActive}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge
                    dot={account.isActive}
                    status={account.isActive ? 'success' : 'default'}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: account.isActive ? '#52c41a' : '#d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {account.login.toString().slice(-2)}
                    </div>
                  </Badge>
                }
                title={
                  <Space>
                    <Text strong>{account.login}</Text>
                    {account.isActive && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Active
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <div>
                      <Text type="secondary">Login: </Text>
                      <Text code>{account.login}</Text>
                    </div>
                    <div>
                      <CloudServerOutlined /> <Text type="secondary">{account.server}</Text>
                    </div>
                    <div>
                      <ClockCircleOutlined />{' '}
                      <Text type="secondary">
                        Last connected: {getLastConnectedDisplay(account.lastConnected)}
                      </Text>
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
          )}
        </>
      )}

      {activeTab === 'add' && (
        <Card title={editingAccount ? 'Edit Account' : 'Add New Account'}>
          <Form
            form={editingAccount ? editForm : form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="login"
              label="MT5 Login"
              rules={[
                { required: true, message: 'Please enter MT5 login' },
                { type: 'number', min: 1, message: 'Login must be a positive number' },
              ]}
              initialValue={editingAccount?.login}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Your MT5 account number"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="MT5 Password"
              rules={[
                { required: true, message: 'Please enter MT5 password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                placeholder="Enter your MT5 password"
                visibilityToggle
              />
            </Form.Item>

            <Form.Item
              name="server"
              label="Server"
              rules={[
                { required: true, message: 'Please enter server' },
              ]}
              initialValue={editingAccount?.server}
            >
              <Input placeholder="e.g., MetaQuotes-Demo, Exness-Live" />
            </Form.Item>

            <Form.Item
              name="path"
              label="MT5 Terminal Path (Optional)"
              initialValue={editingAccount?.path}
            >
              <Input placeholder="e.g., C:\\Program Files\\MetaTrader 5" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingAccount ? 'Update Account' : 'Save Account'}
                </Button>
                <Button onClick={() => handleTabChange('list')}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Modal>
  );
};

export default AccountManagementModal;
