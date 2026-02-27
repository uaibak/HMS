import { Card, Table } from 'antd';
import type { TableProps } from 'antd';

type Props<T> = TableProps<T> & {
  title?: React.ReactNode;
};

export function DataTableWrapper<T extends object>({ title, ...props }: Props<T>) {
  return (
    <Card className="surface-card" title={title} bodyStyle={{ padding: 0 }}>
      <Table<T> size="middle" {...props} />
    </Card>
  );
}
