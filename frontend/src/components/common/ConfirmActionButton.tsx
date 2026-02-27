import { Button, Popconfirm } from 'antd';

export function ConfirmActionButton({
  title,
  danger,
  onConfirm,
  children,
}: {
  title: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <Popconfirm title={title} onConfirm={onConfirm} okText="Yes" cancelText="No">
      <Button danger={danger}>{children}</Button>
    </Popconfirm>
  );
}
