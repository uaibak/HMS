import { Layout, Menu, Typography, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const items = [
  { key: '/dashboard', label: 'Dashboard' },
  { key: '/users', label: 'Users' },
  { key: '/patients', label: 'Patients' },
  { key: '/doctors', label: 'Doctors' },
  { key: '/appointments', label: 'Appointments' },
  { key: '/pharmacy', label: 'Pharmacy' },
  { key: '/lab', label: 'Lab' },
  { key: '/billing', label: 'Billing' },
  { key: '/reports', label: 'Reports' },
  { key: '/settings', label: 'Settings' },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={{ padding: 16 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            HMS
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text>
            {user?.firstName} {user?.lastName} ({user?.role})
          </Typography.Text>
          <Button onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </Header>
        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
