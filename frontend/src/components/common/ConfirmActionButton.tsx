import { Button, Popconfirm } from 'antd';

export function ConfirmActionButton({
  title,
  danger,
  onConfirm,
  loading,
  children,
}: {
  title: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Popconfirm title={title} onConfirm={onConfirm} okText="Yes" cancelText="No">
      <Button danger={danger} loading={loading} disabled={loading}>
        {children}
      </Button>
    </Popconfirm>
  );
}
