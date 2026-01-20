import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Layout, Flex, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { signInWithIdentity, signChallengeWithIdentity } from '../utils/icpIdentity';
import { apolloClient } from '../graphql/client';
import { GENERATE_ICP_CHALLENGE } from '../graphql/user';
import { appContext } from '../context/App';

const { Title, Paragraph } = Typography;

interface SignInFormData {
  usernameOrEmail: string;
  password: string;
  remember?: boolean;
}


const initialValues = {
}

const SignIn: React.FC = () => {
  const { t } = useTranslation();
  const { login, loginWithIcp, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const { message } = appContext;
  
  const loading = authLoading || isSubmitting;

  const from = location.state?.from?.pathname || '/dashboard';

  const handleFinish = async (values: SignInFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      const success = await login(values.usernameOrEmail, values.password);
      
      if (success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.warn('Login error caught:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInWithIcp = async () => {
    try {
      // Step 1: Sign in with Internet Identity
      const info = await signInWithIdentity();

      if (!info.authenticated || !info.principalText) {
        console.warn('[ICP][II] No principal from Internet Identity');
        message?.warning(t('auth.icpLoginCancelled'));
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
        message?.error(t('auth.icpChallengeError'));
        return;
      }

      // Step 3: Sign challenge with identity
      const signedData = await signChallengeWithIdentity(challengeJson);

      // Step 4: Send to backend for verification and login
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
      console.error('[ICP][II] Error during Internet Identity sign-in:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('failed')) {
        message?.warning(t('auth.icpLoginCancelled'));
      } else {
        message?.error(t('auth.icpLoginFailed'));
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.signIn')} - Dashboard App</title>
        <meta name="description" content={t('auth.welcomeBack')} />
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
                {t('auth.signIn')}
              </Title>
              <Paragraph className="text-gray-600 mb-0">
                {t('auth.welcomeBack')}
              </Paragraph>
            </div>

            <Form
              form={form}
              name="signin"
              onFinish={handleFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              initialValues={initialValues}
              preserve={false}
            >
              <Form.Item
                label="Email or Username"
                name="usernameOrEmail"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your email or username'
                  }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter email or username"
                />
              </Form.Item>

              <Form.Item
                label={t('common.password')}
                name="password"
                rules={[
                  {
                    required: true,
                    message: t('auth.passwordRequired')
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('common.password')}
                />
              </Form.Item>

              {/* Debug info */}
              {loading && (
                <div style={{ textAlign: 'center', marginBottom: '16px', color: '#666' }}>
                  <small>🔄 Processing your request...</small>
                </div>
              )}
              
              <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={loading}
                    block
                    icon={!loading ? <LoginOutlined /> : undefined}
                    className="h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>

                  <Button
                    type="default"
                    onClick={handleSignInWithIcp}
                    block
                    disabled={loading}
                    icon={<img src="/icp.svg" alt="ICP" style={{ width: 20, height: 20 }} />}
                  >
                    {t('auth.signInWithIcp')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <div className="text-center">
              <Paragraph>
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
                  {t('auth.signUp')}
                </Link>
              </Paragraph>
            </div> 
          </Card>
        </Flex>
      </Layout>
    </>
  );
};

export default SignIn;
