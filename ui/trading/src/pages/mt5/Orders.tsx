import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client/react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalculatorOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import {
  MT5_ACCOUNT_INFO_QUERY,
  MT5_ORDERS_QUERY,
  MT5_POSITIONS_LIVE_QUERY,
  MT5_TRADING_HISTORY_QUERY,
  CLOSE_POSITION_MUTATION,
  PLACE_ORDER_MUTATION,
  MT5_POSITIONS_UPDATES_SUBSCRIPTION,
  MT5_ORDERS_UPDATES_SUBSCRIPTION,
  MT5_ACCOUNT_UPDATES_SUBSCRIPTION,
  CONNECT_MT5_MUTATION,
  ADOPT_MT5_LOGIN_MUTATION,
} from '../../graphql/mt5';
import { SAVED_MT5_ACCOUNTS_QUERY, CONNECT_SAVED_ACCOUNT_MUTATION } from '../../graphql/mt5Account';
import { PLACE_BULK_ORDER_MUTATION } from '../../graphql/bulkOrder';
import type {
  MT5AccountInfo,
  MT5LiveOrder,
  MT5LivePosition,
  MT5Trade,
  PlaceOrderInput,
} from '../../types/mt5';
import type { SavedAccount } from '../../types/mt5Account';
import type { CalculatedOrder } from '../../types/bulkOrder';
import type { ResponseStatus } from '../../types/common';
import { appContext } from '../../context/App';
import BulkOrderModal from '../../components/BulkOrderModal';
import AccountManagementModal from '../../components/AccountManagementModal';

const { Title, Text } = Typography;

type TabKey = 'open' | 'pending' | 'closed';

type OrderFormValues = {
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  price: number;
  sl?: number;
  tp?: number;
  magic?: number;
};

type ConnectFormValues = {
  login: string;
  password: string;
  server?: string;
  path?: string;
};

const getSideTag = (type: number) => {
  const isBuy = type === 0;
  return (
    <Tag color={isBuy ? 'green' : 'red'}>
      {isBuy ? 'Buy' : 'Sell'}
    </Tag>
  );
};

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [search, setSearch] = useState('');
  const [placeOrderOpen, setPlaceOrderOpen] = useState(false);
  const [bulkOrderOpen, setBulkOrderOpen] = useState(false);
  const [accountManagementOpen, setAccountManagementOpen] = useState(false);
  const [form] = Form.useForm<OrderFormValues>();
  const [connectForm] = Form.useForm<ConnectFormValues>();
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectError] = useState<string | null>(null);

  const {
    data: accountData,
    loading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useQuery<{ mt5AccountInfo: MT5AccountInfo | null }>(MT5_ACCOUNT_INFO_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const {
    data: savedAccountsData,
    loading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery<{ savedMt5Accounts: SavedAccount[] }>(SAVED_MT5_ACCOUNTS_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const {
    data: positionsData,
    loading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
  } = useQuery<{ mt5PositionsLive: MT5LivePosition[] }>(MT5_POSITIONS_LIVE_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const {
    data: ordersData,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery<{ mt5Orders: MT5LiveOrder[] }>(MT5_ORDERS_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<{ tradingHistory: MT5Trade[] }>(MT5_TRADING_HISTORY_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const [placeOrder, { loading: placeOrderLoading }] = useMutation(PLACE_ORDER_MUTATION, {
    errorPolicy: 'all',
  });

  const [connectSavedAccount, { loading: connectLoading }] = useMutation(CONNECT_SAVED_ACCOUNT_MUTATION, {
    errorPolicy: 'all',
  });

  const [closePosition, { loading: closePositionLoading }] = useMutation(CLOSE_POSITION_MUTATION, {
    errorPolicy: 'all',
  });

  const [placeBulkOrder, { loading: bulkOrderLoading }] = useMutation(PLACE_BULK_ORDER_MUTATION, {
    errorPolicy: 'all',
  });

  const [connectMt5, { loading: mt5ConnectLoading }] = useMutation(CONNECT_MT5_MUTATION, {
    errorPolicy: 'all',
  });

  const [adoptMt5Login] = useMutation(ADOPT_MT5_LOGIN_MUTATION, {
    errorPolicy: 'all',
  });

  const [positions, setPositions] = useState<MT5LivePosition[]>([]);
  const [pendingOrders, setPendingOrders] = useState<MT5LiveOrder[]>([]);
  const [accountInfo, setAccountInfo] = useState<MT5AccountInfo | null>(null);

  // Real-time subscriptions
  const { data: positionsUpdateData } = useSubscription(
    MT5_POSITIONS_UPDATES_SUBSCRIPTION,
    {
      skip: !accountData?.mt5AccountInfo, // Only subscribe when connected
      onError: (error) => console.error('Positions subscription error:', error),
    }
  );

  const { data: ordersUpdateData } = useSubscription(
    MT5_ORDERS_UPDATES_SUBSCRIPTION,
    {
      skip: !accountData?.mt5AccountInfo, // Only subscribe when connected
      onError: (error) => console.error('Orders subscription error:', error),
    }
  );

  const { data: accountUpdateData } = useSubscription(
    MT5_ACCOUNT_UPDATES_SUBSCRIPTION,
    {
      skip: !accountData?.mt5AccountInfo, // Only subscribe when connected
      onError: (error) => console.error('Account subscription error:', error),
    }
  );

  // Update positions when subscription data arrives
  React.useEffect(() => {
    if (positionsUpdateData?.mt5PositionsUpdates) {
      const updatedPosition = positionsUpdateData.mt5PositionsUpdates;
      setPositions(prev => {
        const filtered = prev.filter(p => p.ticket !== updatedPosition.ticket);
        return [...filtered, updatedPosition];
      });
    }
  }, [positionsUpdateData]);

  // Update orders when subscription data arrives
  React.useEffect(() => {
    if (ordersUpdateData?.mt5OrdersUpdates) {
      const updatedOrder = ordersUpdateData.mt5OrdersUpdates;
      setPendingOrders(prev => {
        const filtered = prev.filter(o => o.ticket !== updatedOrder.ticket);
        return [...filtered, updatedOrder];
      });
    }
  }, [ordersUpdateData]);

  // Update account info when subscription data arrives
  React.useEffect(() => {
    if (accountUpdateData?.mt5AccountUpdates) {
      setAccountInfo(accountUpdateData.mt5AccountUpdates);
    }
  }, [accountUpdateData]);

  // Initialize with query data
  React.useEffect(() => {
    if (positionsData?.mt5PositionsLive) {
      setPositions(positionsData.mt5PositionsLive);
    }
  }, [positionsData]);

  React.useEffect(() => {
    if (ordersData?.mt5Orders) {
      setPendingOrders(ordersData.mt5Orders);
    }
  }, [ordersData]);

  React.useEffect(() => {
    if (accountData?.mt5AccountInfo) {
      setAccountInfo(accountData.mt5AccountInfo);
    }
  }, [accountData]);

  const closedTrades = historyData?.tradingHistory ?? [];

  const filteredPositions = useMemo(() => {
    if (!search) return positions;
    const s = search.toLowerCase();
    return positions.filter((p) => p.symbol?.toLowerCase().includes(s));
  }, [positions, search]);

  const filteredOrders = useMemo(() => {
    if (!search) return pendingOrders;
    const s = search.toLowerCase();
    return pendingOrders.filter((o) => o.symbol?.toLowerCase().includes(s));
  }, [pendingOrders, search]);

  // Load saved form data on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('mt5-connect-form');
    if (savedData && connectForm) {
      try {
        const parsed = JSON.parse(savedData);
        connectForm.setFieldsValue(parsed);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }
  }, []);

  const handleConnect = async () => {
    try {
      const values = await connectForm.validateFields();
      // Save form data to localStorage
      localStorage.setItem('mt5-connect-form', JSON.stringify(values));
      
      await connectMt5({
        variables: {
          account: {
            login: values.login,
            password: values.password,
            server: values.server || 'MetaQuotes-Demo',
            path: values.path || null,
          },
        },
      });
    } catch (error) {
      // Modal stays open on validation error
    }
  };

  const handleAdoptLogin = async () => {
    await adoptMt5Login();
  };

  const openColumns: ColumnsType<MT5LivePosition> = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      render: (symbol: string) => <Text strong>{symbol}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: number) => getSideTag(type),
    },
    {
      title: 'Volume, lot',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: 'Open price',
      dataIndex: 'priceOpen',
      key: 'priceOpen',
      width: 140,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: 'Current price',
      dataIndex: 'priceCurrent',
      key: 'priceCurrent',
      width: 140,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: 'T/P',
      dataIndex: 'tp',
      key: 'tp',
      width: 110,
      render: (v: number) => (v ? <Text>{v}</Text> : <Text type="secondary">-</Text>),
    },
    {
      title: 'S/L',
      dataIndex: 'sl',
      key: 'sl',
      width: 110,
      render: (v: number) => (v ? <Text>{v}</Text> : <Text type="secondary">-</Text>),
    },
    {
      title: 'P/L',
      dataIndex: 'profit',
      key: 'profit',
      width: 110,
      align: 'right',
      render: (p: number) => (
        <Text style={{ color: p >= 0 ? '#52c41a' : '#ff4d4f' }}>{p.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_: unknown, record: MT5LivePosition) => (
        <Popconfirm
          title="Close this position?"
          okText="Close"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: closePositionLoading }}
          onConfirm={async () => {
            try {
              const result = await closePosition({ variables: { positionId: String(record.ticket) } });
              const response = result.data?.closePosition;
              
              if (response?.status === 'SUCCESS') {
                appContext.notification?.success({
                  message: response.message || 'Position closed successfully',
                  description: response.data ? `Position ID: ${response.data}` : undefined,
                });
                refetchPositions();
                refetchHistory();
              } else if (response?.status === 'ERROR') {
                // Display structured error from backend
                const errorMsg = response.details ? `${response.message}\n\n${response.details}` : response.message;
                appContext.notification?.error({
                  message: 'Failed to close position',
                  description: errorMsg,
                });
              } else if (result.errors) {
                // Fallback for GraphQL errors
                appContext.notification?.error({
                  message: 'Failed to close position',
                  description: result.errors[0].message,
                });
              }
            } catch (error: any) {
              appContext.notification?.error({
                message: 'Failed to close position',
                description: error.message || 'Failed to close position',
              });
            }
          }}
        >
          <Button danger size="small">
            Close
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const pendingColumns: ColumnsType<MT5LiveOrder> = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      render: (symbol: string) => <Text strong>{symbol}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: number) => getSideTag(type),
    },
    {
      title: 'Volume, lot',
      dataIndex: 'volumeCurrent',
      key: 'volumeCurrent',
      width: 120,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: 'Open price',
      dataIndex: 'priceOpen',
      key: 'priceOpen',
      width: 140,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: 'T/P',
      dataIndex: 'tp',
      key: 'tp',
      width: 110,
      render: (v: number) => (v ? <Text>{v}</Text> : <Text type="secondary">-</Text>),
    },
    {
      title: 'S/L',
      dataIndex: 'sl',
      key: 'sl',
      width: 110,
      render: (v: number) => (v ? <Text>{v}</Text> : <Text type="secondary">-</Text>),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 110,
      render: (v: number) => <Tag>{v}</Tag>,
    },
  ];

  const closedColumns: ColumnsType<MT5Trade> = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      render: (symbol: string) => <Text strong>{symbol}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (t: string) => (
        <Tag color={t?.toUpperCase() === 'BUY' ? 'green' : 'red'}>{t}</Tag>
      ),
    },
    {
      title: 'Volume, lot',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
    },
    {
      title: 'P/L',
      dataIndex: 'profit',
      key: 'profit',
      width: 110,
      align: 'right',
      render: (p: number) => (
        <Text style={{ color: p >= 0 ? '#52c41a' : '#ff4d4f' }}>{p.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Open time',
      dataIndex: 'openTime',
      key: 'openTime',
      width: 180,
      render: (t: string) => <Text type="secondary">{t ? new Date(t).toLocaleString() : '-'}</Text>,
    },
    {
      title: 'Close time',
      dataIndex: 'closeTime',
      key: 'closeTime',
      width: 180,
      render: (t?: string | null) => <Text type="secondary">{t ? new Date(t).toLocaleString() : '-'}</Text>,
    },
  ];

  const handleAccountConnect = async (accountId: string) => {
    try {
      const result = await connectSavedAccount({
        variables: { accountId }
      });

      const response = result.data?.connectSavedAccount;
      
      if (response?.status === 'SUCCESS') {
        appContext.notification?.success({
          message: 'Connected successfully',
          description: response.message,
        });
        setAccountManagementOpen(false);
        refetchAccount();
        refetchAccounts();
      } else if (response?.status === 'ERROR') {
        const errorMsg = response.details ? `${response.message}\n\n${response.details}` : response.message;
        appContext.notification?.error({
          message: 'Connection failed',
          description: errorMsg,
        });
      } else if (result.errors) {
        appContext.notification?.error({
          message: 'Connection failed',
          description: result.errors[0].message,
        });
      }
    } catch (error: any) {
      appContext.notification?.error({
        message: 'Connection failed',
        description: error.message || 'Unknown error occurred',
      });
    }
  };

  const handleAccountSaved = () => {
    refetchAccounts();
  };

  const refreshAll = () => {
    refetchAccount();
    refetchPositions();
    refetchOrders();
    refetchHistory();
  };

  const handleBulkOrderSubmit = async (orders: CalculatedOrder[]) => {
    try {
      const result = await placeBulkOrder({
        variables: {
          bulkOrder: {
            orders: orders.map(order => ({
              symbol: order.symbol,
              type: order.type,
              volume: order.volume,
              price: order.price,
            }))
          }
        }
      });

      const response = result.data?.placeBulkOrder;
      
      if (response?.status === 'SUCCESS') {
        appContext.notification?.success({
          message: 'Bulk orders placed successfully',
          description: `${orders.length} orders have been placed`,
        });
        setBulkOrderOpen(false);
        refreshAll();
      } else if (response?.status === 'ERROR') {
        const errorMsg = response.details ? `${response.message}\n\n${response.details}` : response.message;
        appContext.notification?.error({
          message: 'Failed to place bulk orders',
          description: errorMsg,
        });
      } else if (result.errors) {
        appContext.notification?.error({
          message: 'Failed to place bulk orders',
          description: result.errors[0].message,
        });
      }
    } catch (error: any) {
      appContext.notification?.error({
        message: 'Failed to place bulk orders',
        description: error.message || 'Unknown error occurred',
      });
    }
  };

  const onSubmitPlaceOrder = async () => {
    const values = await form.validateFields();
    const input: PlaceOrderInput = {
      symbol: values.symbol,
      volume: values.volume,
      type: values.type,
      price: values.price,
      sl: values.sl,
      tp: values.tp,
      magic: values.magic,
    };

    await placeOrder({
      variables: { order: input },
    });

    setPlaceOrderOpen(false);
    form.resetFields();
    refetchOrders();
    refetchPositions();
  };

  const tabCounts = {
    open: positions.length,
    pending: pendingOrders.length,
    closed: closedTrades.length,
  };

  const currentAccountInfo = accountInfo || accountData?.mt5AccountInfo;

  const loading = accountLoading || positionsLoading || ordersLoading || historyLoading;

  const errorMessage =
    accountError?.message || positionsError?.message || ordersError?.message || historyError?.message;

  return (
    <Card>
      <Space vertical size="large" style={{ width: '100%' }}>
        <Flex justify="space-between" align="center">
          <Title level={3} style={{ margin: 0 }}>
            Orders
          </Title>
          <Space>
            <Input
              allowClear
              placeholder="Search symbol..."
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              icon={<KeyOutlined />}
              onClick={() => setAccountManagementOpen(true)}
            >
              Manage Accounts
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setPlaceOrderOpen(true)}
              disabled={!accountData?.mt5AccountInfo}
            >
              Place Order
            </Button>
            <Button
              icon={<CalculatorOutlined />}
              onClick={() => setBulkOrderOpen(true)}
              disabled={!accountData?.mt5AccountInfo}
            >
              Bulk Orders
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshAll}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </Flex>

        {errorMessage && (
          <Alert
            title="Error"
            description={errorMessage}
            type="error"
            showIcon
          />
        )}

        {currentAccountInfo && (
          <Card size="small">
            <Flex justify="space-between" wrap>
              <Space>
                <Text strong>Account:</Text>
                <Text>{currentAccountInfo.login}</Text>
                <Text type="secondary">{currentAccountInfo.server}</Text>
                <Text type="secondary">{currentAccountInfo.name}</Text>
              </Space>
              <Space>
                <Text type="secondary">Balance</Text>
                <Text>{currentAccountInfo.balance.toFixed(2)}</Text>
                <Text type="secondary">Credit</Text>
                <Text>{currentAccountInfo.credit.toFixed(2)}</Text>
                <Text type="secondary">Profit</Text>
                <Text style={{ color: currentAccountInfo.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  {currentAccountInfo.profit.toFixed(2)}
                </Text>
              </Space>
              <Space>
                <Text type="secondary">Equity</Text>
                <Text>{currentAccountInfo.equity.toFixed(2)}</Text>
                <Text type="secondary">Margin</Text>
                <Text>{currentAccountInfo.margin.toFixed(2)}</Text>
                <Text type="secondary">Free</Text>
                <Text>{currentAccountInfo.marginFree.toFixed(2)}</Text>
                <Text type="secondary">Level</Text>
                <Text>{currentAccountInfo.marginLevel?.toFixed(1)}%</Text>
              </Space>
            </Flex>
            {currentAccountInfo.marginSoCall > 0 && (
              <Alert
                title="Margin Call Warning"
                description={`Margin level at ${currentAccountInfo.marginLevel?.toFixed(1)}%. Call at ${currentAccountInfo.marginSoCall}%, Stop Out at ${currentAccountInfo.marginSoSo}%`}
                type={
                  currentAccountInfo.marginLevel
                    ? currentAccountInfo.marginSoSo > 0
                      ? currentAccountInfo.marginLevel <= currentAccountInfo.marginSoSo
                        ? 'error'  // Đỏ: Stop Out level
                        : currentAccountInfo.marginLevel <= currentAccountInfo.marginSoCall
                        ? 'warning' // Vàng: Margin Call level  
                        : 'success' // Xanh: An toàn
                      : currentAccountInfo.marginLevel <= currentAccountInfo.marginSoCall
                        ? 'warning' // Vàng: Margin Call level  
                        : 'success' // Xanh: An toàn
                    : 'warning'
                }
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
            <Flex style={{ marginTop: 8 }} gap="small">
              <Tag color={currentAccountInfo.tradeAllowed ? 'green' : 'red'}>
                Trading: {currentAccountInfo.tradeAllowed ? 'Allowed' : 'Disabled'}
              </Tag>
              <Tag color={currentAccountInfo.tradeExpert ? 'blue' : 'default'}>
                Expert: {currentAccountInfo.tradeExpert ? 'Enabled' : 'Disabled'}
              </Tag>
              <Tag color="default">
                Leverage: 1:{currentAccountInfo.leverage}
              </Tag>
              <Tag color="default">
                Digits: {currentAccountInfo.currencyDigits}
              </Tag>
              {currentAccountInfo.fifoClose && (
                <Tag color="purple">FIFO Close</Tag>
              )}
            </Flex>
          </Card>
        )}

        {!accountData?.mt5AccountInfo && savedAccountsData?.savedMt5Accounts && savedAccountsData.savedMt5Accounts.length > 0 && (
              <Alert
                title="MT5 Accounts Available"
                description={
                  <div>
                    <p>You have saved MT5 accounts. Click "Manage Accounts" to connect.</p>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<KeyOutlined />}
                        onClick={() => setAccountManagementOpen(true)}
                      >
                        Manage Accounts
                      </Button>
                    </Space>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {!accountData?.mt5AccountInfo && !savedAccountsData?.savedMt5Accounts?.length && (
              <Alert
                title="No Saved Accounts"
                description="Click 'Manage Accounts' to add your first MT5 account."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

        <Segmented
          value={activeTab}
          onChange={(v) => setActiveTab(v as TabKey)}
          options={[
            {
              label: (
                <Space size={6}>
                  <span>Open</span>
                  <Badge count={tabCounts.open} showZero />
                </Space>
              ),
              value: 'open',
            },
            {
              label: (
                <Space size={6}>
                  <span>Pending</span>
                  <Badge count={tabCounts.pending} showZero />
                </Space>
              ),
              value: 'pending',
            },
            {
              label: (
                <Space size={6}>
                  <span>Closed</span>
                  <Badge count={tabCounts.closed} showZero />
                </Space>
              ),
              value: 'closed',
            },
          ]}
        />

        {activeTab === 'open' && (
          <Table
            rowKey={(r) => String(r.ticket)}
            columns={openColumns}
            dataSource={filteredPositions}
            loading={positionsLoading}
            pagination={false}
            scroll={{ x: 900 }}
          />
        )}

        {activeTab === 'pending' && (
          <Table
            rowKey={(r) => String(r.ticket)}
            columns={pendingColumns}
            dataSource={filteredOrders}
            loading={ordersLoading}
            pagination={false}
            scroll={{ x: 900 }}
          />
        )}

        {activeTab === 'closed' && (
          <Table
            rowKey={(r) => String(r.id)}
            columns={closedColumns}
            dataSource={closedTrades}
            loading={historyLoading}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 900 }}
          />
        )}
      </Space>

      <Modal
        title="Connect MT5"
        open={connectOpen}
        onCancel={() => setConnectOpen(false)}
        okText="Connect"
        onOk={handleConnect}
        confirmLoading={mt5ConnectLoading}
        destroyOnHidden
      >
        <Form
          form={connectForm}
          layout="vertical"
          initialValues={{ server: 'MetaQuotes-Demo' }}
        >
          {connectError && (
            <Alert
              title="Connection Error"
              description={connectError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item 
            name="login" 
            label="Login" 
            rules={[{ required: true }]}
            tooltip="Your MT5 account number (e.g., 12345678)"
          >
            <Input placeholder="Enter your MT5 login" />
          </Form.Item>
          <Form.Item 
            name="password" 
            label="Password" 
            rules={[{ required: true }]}
            tooltip="Your MT5 account password"
          >
            <Input.Password placeholder="Enter your MT5 password" />
          </Form.Item>
          <Form.Item 
            name="server" 
            label="Server"
            tooltip="MT5 broker server name. Default is MetaQuotes-Demo for demo accounts"
          >
            <Input placeholder="MetaQuotes-Demo" />
          </Form.Item>
          <Form.Item 
            name="path" 
            label="Terminal path"
            tooltip="Optional: Path to MT5 terminal executable. Only needed if MT5 is not in default location"
          >
            <Input placeholder="C:\\Program Files\\MetaTrader 5\\terminal64.exe" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Place order"
        open={placeOrderOpen}
        onCancel={() => setPlaceOrderOpen(false)}
        okText="Submit"
        onOk={onSubmitPlaceOrder}
        confirmLoading={placeOrderLoading}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'BUY', volume: 0.01 }}
        >
          <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
            <Input placeholder="BTCUSD" />
          </Form.Item>

          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Segmented options={[{ label: 'Buy', value: 'BUY' }, { label: 'Sell', value: 'SELL' }]} />
          </Form.Item>

          <Form.Item name="volume" label="Volume (lot)" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="tp" label="Take Profit">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="sl" label="Stop Loss">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="magic" label="Magic">
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <AccountManagementModal
        visible={accountManagementOpen}
        onCancel={() => setAccountManagementOpen(false)}
        onConnect={handleAccountConnect}
        onSaved={handleAccountSaved}
        loading={connectLoading}
      />

      <BulkOrderModal
        visible={bulkOrderOpen}
        onCancel={() => setBulkOrderOpen(false)}
        onSubmit={handleBulkOrderSubmit}
        loading={bulkOrderLoading}
        accountInfo={currentAccountInfo}
      />
    </Card>
  );
};

export default OrdersPage;
