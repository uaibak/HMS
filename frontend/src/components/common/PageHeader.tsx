import { Breadcrumb, Space, Tag, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

export function PageHeader({
  title,
  subtitle,
  roleTag,
  extra,
}: {
  title: string;
  subtitle?: string;
  roleTag?: string;
  extra?: React.ReactNode;
}) {
  const location = useLocation();
  const crumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => ({
      title: segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      key: `${segment}-${index}`,
      href: `/${arr.slice(0, index + 1).join('/')}`,
    }));

  return (
    <div className="section-toolbar">
      <Space direction="vertical" size={2}>
        <Breadcrumb items={crumbs.length ? crumbs : [{ title: 'Dashboard' }]} />
        <Space align="center" size={8}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {roleTag ? <Tag color="cyan">{roleTag}</Tag> : null}
        </Space>
        {subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
      </Space>
      {extra}
    </div>
  );
}
