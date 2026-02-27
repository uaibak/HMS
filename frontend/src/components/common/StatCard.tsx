import { Card, Space, Tag, Typography } from 'antd';

export function StatCard({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
}) {
  const toneMap: Record<string, string> = {
    default: 'default',
    success: 'green',
    warning: 'orange',
    info: 'blue',
  };

  return (
    <Card className="surface-card" bodyStyle={{ padding: 18 }}>
      <Space direction="vertical" size={6}>
        <Typography.Text className="kpi-label">{label}</Typography.Text>
        <Typography.Text className="kpi-value">
          {value}
          {suffix ? <Typography.Text type="secondary"> {suffix}</Typography.Text> : null}
        </Typography.Text>
        {tone && tone !== 'default' ? <Tag color={toneMap[tone]}>{tone.toUpperCase()}</Tag> : null}
      </Space>
    </Card>
  );
}
