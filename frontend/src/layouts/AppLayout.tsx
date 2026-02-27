import { Layout, Menu, Typography, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';

const { Header, Sider, Content } = Layout;

const items = [
  { key: '/dashboard', label: 'Dashboard', isAllowed: (role?: string) => !!role },
  { key: '/users', label: 'Users', isAllowed: (role?: string) => can(role, 'users', 'view') },
  { key: '/patients', label: 'Patients', isAllowed: (role?: string) => can(role, 'patients', 'view') },
  { key: '/doctors', label: 'Doctors', isAllowed: (role?: string) => can(role, 'doctors', 'view') },
  { key: '/appointments', label: 'Appointments', isAllowed: (role?: string) => can(role, 'appointments', 'view') },
  { key: '/pharmacy', label: 'Pharmacy', isAllowed: (role?: string) => can(role, 'pharmacy', 'view') },
  { key: '/lab', label: 'Lab', isAllowed: (role?: string) => can(role, 'lab', 'view') || can(role, 'lab', 'create') },
  { key: '/billing', label: 'Billing', isAllowed: (role?: string) => can(role, 'billing', 'view') },
  { key: '/reports', label: 'Reports', isAllowed: (role?: string) => can(role, 'reports', 'view') },
  { key: '/settings', label: 'Settings', isAllowed: (role?: string) => can(role, 'settings', 'view') },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const visibleItems = items.filter((item) => item.isAllowed(user?.role));

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
          // Hide modules that are not allowed for the logged-in role.
          items={visibleItems}
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
