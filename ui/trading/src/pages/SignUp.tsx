import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Progress, Layout, Flex, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  UserAddOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { signInWithIdentity, signChallengeWithIdentity } from '../utils/icpIdentity';
import { apolloClient } from '../graphql/client';
import { GENERATE_ICP_CHALLENGE } from '../graphql/user';

const { Title, Paragraph, Text } = Typography;

const initialValues = {
}

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const { signup, loginWithIcp, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  
  const loading = authLoading || isSubmitting;

  const from = location.state?.from?.pathname || '/dashboard';

  const handleFinish = async (values: SignUpFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      const success = await signup(values.name, values.email, values.password);

      if (success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.warn('Signup error caught:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, status: 'exception' as const };

    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    let status: 'success' | 'active' | 'exception' = 'exception';
    if (strength >= 75) status = 'success';
    else if (strength >= 50) status = 'active';

    return { strength, status };
  };

  const passwordValue = Form.useWatch('password', form) || '';
  const { strength, status } = getPasswordStrength(passwordValue);

  const handleSignUpWithIcp = async () => {
    try {
      // Step 1: Sign in with Internet Identity
      const info = await signInWithIdentity();

      if (!info.authenticated || !info.principalText) {
        console.warn('[ICP][II] No principal from Internet Identity');
        return;
      }

      // Step 2: Get challenge from backend with principal
      const { data: challengeData } = await apolloClient.query<{ generateIcpChallenge: string }>({
        query: GENERATE_ICP_CHALLENGE,
        variables: { principal: info.principalText },
        fetchPolicy: 'network-only',
      });

      const challengeJson = challengeData?.generateIcpChallenge;

      if (!challengeJson) {
        console.error('[ICP] No challenge received from backend');
        return;
      }

      // Step 3: Sign challenge with identity
      const signedData = await signChallengeWithIdentity(challengeJson);

      // Step 4: Send to backend for verification and signup/login
      const success = await loginWithIcp(
        signedData.principal,
        signedData.challenge,
        signedData.signature,
        signedData.publicKey,
        signedData.certificate,
      );

      if (success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('[ICP][II] Error during Internet Identity sign-up:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.signUp')} - Dashboard App</title>
        <meta name="description" content={t('auth.createAccount')} />
      </Helmet>

      <Layout>
        <Flex align='center' justify='center' style={{ margin: "auto" }}>
          <Card style={{ width: 'fit-content' }}>
            <div className="text-center mb-8">
              <Link
                to="/home"
                className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4"
              >
                <ArrowLeftOutlined className="mr-2" />
                {t('common.back')}
              </Link>

              <Title level={2} className="mb-2">
                {t('auth.signUp')}
              </Title>
              <Paragraph className="text-gray-600 mb-0">
                {t('auth.createAccount')}
              </Paragraph>
            </div>

            <Form
              form={form}
              name="signup"
              onFinish={handleFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              initialValues={initialValues}
              preserve={false}
            >
              <Form.Item
                label={t('common.name')}
                name="name"
                rules={[
                  {
                    required: true,
                    message: t('auth.nameRequired')
                  },
                  {
                    min: 2,
                    message: 'Name must be at least 2 characters'
                  }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={t('common.name')}
                />
              </Form.Item>

              <Form.Item
                label={t('common.email')}
                name="email"
                rules={[
                  {
                    required: true,
                    message: t('auth.emailRequired')
                  },
                  {
                    type: 'email',
                    message: t('auth.invalidEmail')
                  }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder={t('common.email')}
                />
              </Form.Item>

              <Form.Item
                label={t('common.password')}
                name="password"
                rules={[
                  {
                    required: true,
                    message: t('auth.passwordRequired')
                  },
                  {
                    min: 6,
                    message: t('auth.passwordMinLength')
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('common.password')}
                />
              </Form.Item>

              {passwordValue && (
                <Form.Item>
                  <div className="mb-2">
                    <Text className="text-sm text-gray-600">Password strength:</Text>
                    <Progress
                      percent={strength}
                      status={status}
                      strokeWidth={6}
                      showInfo={false}
                      className="mt-1"
                    />
                  </div>
                </Form.Item>
              )}

              <Form.Item
                label={t('common.confirmPassword')}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  {
                    required: true,
                    message: 'Please confirm your password'
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('auth.passwordsNotMatch')));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('common.confirmPassword')}
                />
              </Form.Item>

              <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={loading}
                    block
                    icon={!loading ? <UserAddOutlined /> : undefined}
                    className="h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 border-0 hover:from-green-700 hover:to-blue-700"
                  >
                    {loading ? t('auth.signingUp') : t('auth.signUp')}
                  </Button>

                  <Button
                    type="default"
                    onClick={handleSignUpWithIcp}
                    block
                    disabled={loading}
                    icon={<img src="/icp.svg" alt="ICP" style={{ width: 20, height: 20 }} />}
                  >
                    {t('auth.signUpWithIcp')}
                  </Button>

                  {loading && (
                    <div className="text-center mt-2 text-gray-500">
                      <small>🔄 Creating your account, please wait...</small>
                    </div>
                  )}
                </Space>
              </Form.Item>
            </Form>

            <div className="text-center">
              <Paragraph>
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/signin" className="text-blue-600 font-semibold hover:text-blue-700">
                  {t('auth.signIn')}
                </Link>
              </Paragraph>
            </div>
          </Card>
        </Flex>
      </Layout>
    </>
  );
};

export default SignUp;
