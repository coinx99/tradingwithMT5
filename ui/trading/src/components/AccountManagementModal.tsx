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
        // Handle update mutation here
        console.log('Update account:', values);
      } else {
        // Save new account
        const values = await form.validateFields();
        // Handle save mutation here
        console.log('Save account:', values);
      }
      
      onSaved();
      handleTabChange('list');
      form.resetFields();
      editForm.resetFields();
      setEditingAccount(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      // Handle delete mutation here
      console.log('Delete account:', accountId);
      onSaved();
    } catch (error) {
      console.error('Delete failed:', error);
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

  const accountList = [
    // Mock data - replace with actual query
    {
      id: '1',
      login: 12345678,
      server: 'MetaQuotes-Demo',
      is_active: true,
      last_connected: '2026-01-22T10:30:00Z',
      created_at: '2026-01-20T08:00:00Z',
      updated_at: '2026-01-22T10:30:00Z',
    },
    {
      id: '2',
      login: 87654321,
      server: 'Exness-Live',
      is_active: false,
      last_connected: '2026-01-15T14:20:00Z',
      created_at: '2026-01-10T12:00:00Z',
      updated_at: '2026-01-15T14:20:00Z',
    },
  ];

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
        <List
          dataSource={accountList}
          renderItem={(account) => (
            <List.Item
              actions={[
                <Tooltip title="Connect to this account">
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={() => onConnect(account.id)}
                    disabled={account.is_active}
                    loading={loading && account.is_active}
                  >
                    {account.is_active ? 'Connected' : 'Connect'}
                  </Button>
                </Tooltip>,
                <Tooltip title="Edit account details">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(account)}
                    disabled={account.is_active}
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
                      disabled={account.is_active}
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
                    dot={account.is_active}
                    status={account.is_active ? 'success' : 'default'}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: account.is_active ? '#52c41a' : '#d9d9d9',
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
                    {account.is_active && (
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
                        Last connected: {getLastConnectedDisplay(account.last_connected)}
                      </Text>
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
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
