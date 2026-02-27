import {
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  MedicineBoxOutlined,
  MenuOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Grid, Layout, Menu, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const navItems = [
  { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined />, isAllowed: (role?: string) => !!role },
  { key: '/users', label: 'Users', icon: <TeamOutlined />, isAllowed: (role?: string) => can(role, 'users', 'view') },
  { key: '/patients', label: 'Patients', icon: <UserOutlined />, isAllowed: (role?: string) => can(role, 'patients', 'view') },
  { key: '/doctors', label: 'Doctors', icon: <AuditOutlined />, isAllowed: (role?: string) => can(role, 'doctors', 'view') },
  { key: '/appointments', label: 'Appointments', icon: <CalendarOutlined />, isAllowed: (role?: string) => can(role, 'appointments', 'view') },
  { key: '/pharmacy', label: 'Pharmacy', icon: <MedicineBoxOutlined />, isAllowed: (role?: string) => can(role, 'pharmacy', 'view') },
  { key: '/lab', label: 'Lab', icon: <ExperimentOutlined />, isAllowed: (role?: string) => can(role, 'lab', 'view') || can(role, 'lab', 'create') },
  { key: '/billing', label: 'Billing', icon: <DollarOutlined />, isAllowed: (role?: string) => can(role, 'billing', 'view') },
  { key: '/reports', label: 'Reports', icon: <DashboardOutlined />, isAllowed: (role?: string) => can(role, 'reports', 'view') },
  { key: '/settings', label: 'Settings', icon: <SettingOutlined />, isAllowed: (role?: string) => can(role, 'settings', 'view') },
];

export function AppLayout() {
  const { md } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const visibleItems = useMemo(
    () => navItems.filter((item) => item.isAllowed(user?.role)),
    [user?.role],
  );

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={visibleItems}
      onClick={(e) => {
        navigate(e.key);
        setDrawerOpen(false);
      }}
      style={{ borderInlineEnd: 'none', padding: 8 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {md ? (
        <Sider width={250}>
          <div style={{ padding: 18, borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
            <Typography.Title level={4} style={{ color: '#f8fafc', margin: 0 }}>
              HMS Console
            </Typography.Title>
            <Typography.Text style={{ color: '#94a3b8' }}>Healthcare Operations</Typography.Text>
          </div>
          {menu}
        </Sider>
      ) : (
        <Drawer
          placement="left"
          width={250}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          bodyStyle={{ background: '#0f172a', padding: 0 }}
          headerStyle={{ background: '#0f172a', color: '#f8fafc' }}
          title={<span style={{ color: '#f8fafc' }}>HMS Console</span>}
        >
          {menu}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInline: 18,
          }}
        >
          <Space>
            {!md ? (
              <Button icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            ) : null}
            <Typography.Text strong style={{ color: '#0f172a' }}>
              Welcome back, {user?.firstName}
            </Typography.Text>
          </Space>
          <Space size={12}>
            <Avatar style={{ backgroundColor: '#0f766e' }}>{user?.firstName?.[0] || 'U'}</Avatar>
            <Space direction="vertical" size={0} style={{ lineHeight: 1 }}>
              <Typography.Text style={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography.Text>
              <Tag color="geekblue" style={{ marginInlineEnd: 0, width: 'fit-content' }}>
                {user?.role}
              </Tag>
            </Space>
            <Button
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: md ? 20 : 12 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
