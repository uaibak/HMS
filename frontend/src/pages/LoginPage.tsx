import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function onFinish(values: { email: string; password: string }) {
    setLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      const target = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
      navigate(target, { replace: true });
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(130deg, #e0f2fe 0%, #f8fafc 46%, #ecfeff 100%)' }}>
      <Card className="surface-card" style={{ width: 380 }}>
        <Typography.Text type="secondary" style={{ letterSpacing: 1.2, fontWeight: 700 }}>
          HMS CONSOLE
        </Typography.Text>
        <Typography.Title level={3} style={{ marginTop: 6 }}>
          Sign in to continue
        </Typography.Title>
        {error ? <Alert type="error" message={error} style={{ marginBottom: 12 }} /> : null}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
}
