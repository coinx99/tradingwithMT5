import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Button,
  Card,
  Table,
  Alert,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
  Progress,
  Tooltip,
  Badge,
  Statistic,
} from 'antd';
import {
  CalculatorOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { BulkOrderForm, CalculatedOrder, BulkOrderSummary } from '../types/bulkOrder';
import { BulkOrderCalculator } from '../utils/bulkOrderCalculator';

const { Title, Text } = Typography;
const { Option } = Select;

interface BulkOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (orders: CalculatedOrder[]) => void;
  loading?: boolean;
  accountInfo?: any;
}

const BulkOrderModal: React.FC<BulkOrderModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  loading,
  accountInfo,
}) => {
  const [form] = Form.useForm<BulkOrderForm>();
  const [calculatedOrders, setCalculatedOrders] = useState<CalculatedOrder[]>([]);
  const [summary, setSummary] = useState<BulkOrderSummary | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate orders when form values change
  const calculateOrders = () => {
    try {
      const formValues = form.getFieldsValue();
      const errors = BulkOrderCalculator.validateForm(formValues);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setCalculatedOrders([]);
        setSummary(null);
        return;
      }

      setValidationErrors([]);
      const orders = BulkOrderCalculator.calculateOrders(formValues);
      const orderSummary = BulkOrderCalculator.generateSummary(orders);
      
      setCalculatedOrders(orders);
      setSummary(orderSummary);
    } catch (error) {
      console.error('Error calculating orders:', error);
      setValidationErrors(['Calculation error occurred']);
    }
  };

  // Auto-calculate on form change
  const onFormChange = () => {
    calculateOrders();
  };

  const handleSubmit = async () => {
    if (calculatedOrders.length === 0) {
      return;
    }

    // Additional risk confirmation for high-risk orders
    if (summary?.riskLevel === 'HIGH') {
      Modal.confirm({
        title: 'High Risk Warning',
        content: 'This bulk order has high risk parameters. Are you sure you want to proceed?',
        okText: 'Yes, Place Orders',
        cancelText: 'Cancel',
        okButtonProps: { danger: true },
        onOk: () => onSubmit(calculatedOrders),
      });
    } else {
      onSubmit(calculatedOrders);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HIGH': return 'red';
      default: return 'default';
    }
  };

  const getDistributionDescription = (type: string) => {
    switch (type) {
      case 'EQUAL': return 'Same volume for all orders';
      case 'PROGRESSIVE': return 'More volume at better prices';
      case 'REGRESSIVE': return 'More volume at worse prices';
      default: return '';
    }
  };

  const orderColumns: ColumnsType<CalculatedOrder> = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'BUY' ? 'green' : 'red'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => price.toFixed(5),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      render: (volume: number) => volume.toFixed(2),
    },
    {
      title: 'Est. Margin',
      dataIndex: 'expectedMargin',
      key: 'expectedMargin',
      width: 120,
      render: (margin?: number) => margin ? `$${margin.toFixed(2)}` : '-',
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <CalculatorOutlined />
          <span>Bulk Order Placement</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={calculatedOrders.length === 0 || validationErrors.length > 0}
        >
          Place {calculatedOrders.length} Orders
        </Button>,
      ]}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Order Parameters" size="small">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                orderType: 'BUY',
                priceRange: { min: 0, max: 0 },
                orderCount: 5,
                volumePerOrder: 0.01,
                distribution: 'EQUAL',
                priceStep: 'AUTO',
              }}
              onValuesChange={onFormChange}
            >
              <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
                <Select placeholder="Select symbol">
                  <Option value="EURUSD">EUR/USD</Option>
                  <Option value="GBPUSD">GBP/USD</Option>
                  <Option value="USDJPY">USD/JPY</Option>
                </Select>
              </Form.Item>

              <Form.Item name="orderType" label="Order Type">
                <Select>
                  <Option value="BUY">BUY</Option>
                  <Option value="SELL">SELL</Option>
                </Select>
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name={['priceRange', 'min']} label="Min Price">
                    <InputNumber
                      style={{ width: '100%' }}
                      precision={5}
                      step={0.00001}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['priceRange', 'max']} label="Max Price">
                    <InputNumber
                      style={{ width: '100%' }}
                      precision={5}
                      step={0.00001}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="orderCount" label="Number of Orders">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={50}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="volumePerOrder" label="Volume per Order">
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0.01}
                      max={10}
                      step={0.01}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="distribution" label="Volume Distribution">
                <Select>
                  <Option value="EQUAL">
                    <Space>
                      <span>Equal</span>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({getDistributionDescription('EQUAL')})
                      </Text>
                    </Space>
                  </Option>
                  <Option value="PROGRESSIVE">
                    <Space>
                      <span>Progressive</span>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({getDistributionDescription('PROGRESSIVE')})
                      </Text>
                    </Space>
                  </Option>
                  <Option value="REGRESSIVE">
                    <Space>
                      <span>Regressive</span>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({getDistributionDescription('REGRESSIVE')})
                      </Text>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item name="priceStep" label="Price Step">
                <Select>
                  <Option value="AUTO">Auto (Evenly Distributed)</Option>
                  <Option value="MANUAL">Manual Step</Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.priceStep !== currentValues.priceStep
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('priceStep') === 'MANUAL' ? (
                    <Form.Item name="manualStep" label="Manual Step Size">
                      <InputNumber
                        style={{ width: '100%' }}
                        precision={5}
                        step={0.00001}
                        placeholder="Enter step size"
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {validationErrors.length > 0 && (
              <Alert
                message="Validation Errors"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
              />
            )}

            {summary && (
              <Card title="Order Summary" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Total Orders"
                      value={summary.totalOrders}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Volume"
                      value={summary.totalVolume}
                      precision={2}
                    />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="Est. Margin"
                      value={summary.totalMargin}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Avg Price"
                      value={summary.averagePrice}
                      precision={5}
                    />
                  </Col>
                </Row>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Risk Level: </Text>
                    <Tag color={getRiskLevelColor(summary.riskLevel)}>
                      {summary.riskLevel}
                    </Tag>
                  </div>
                  <div>
                    <Text strong>Price Range: </Text>
                    <Text>
                      {summary.priceRange.min.toFixed(5)} - {summary.priceRange.max.toFixed(5)}
                    </Text>
                  </div>
                </Space>
              </Card>
            )}

            {summary?.riskLevel === 'HIGH' && (
              <Alert
                message="High Risk Warning"
                description="This bulk order has high risk parameters. Please review carefully before proceeding."
                type="warning"
                showIcon
                icon={<WarningOutlined />}
              />
            )}

            {accountInfo && (
              <Card title="Account Status" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Balance"
                      value={accountInfo.balance}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Free Margin"
                      value={accountInfo.marginFree}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                </Row>
                {summary && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Margin Usage: </Text>
                    <Progress
                      percent={Math.min((summary.totalMargin / accountInfo.marginFree) * 100, 100)}
                      status={summary.totalMargin > accountInfo.marginFree ? 'exception' : 'normal'}
                      size="small"
                    />
                  </div>
                )}
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {calculatedOrders.length > 0 && (
        <Card title="Calculated Orders" size="small" style={{ marginTop: 16 }}>
          <Table
            columns={orderColumns}
            dataSource={calculatedOrders}
            pagination={false}
            size="small"
            scroll={{ y: 200 }}
          />
        </Card>
      )}
    </Modal>
  );
};

export default BulkOrderModal;
