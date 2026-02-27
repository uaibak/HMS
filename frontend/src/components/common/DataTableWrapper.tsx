import { Card, Table } from 'antd';
import type { TableProps } from 'antd';

type Props<T> = TableProps<T> & {
  cardTitle?: React.ReactNode;
};

export function DataTableWrapper<T extends object>({ cardTitle, ...props }: Props<T>) {
  return (
    <Card className="surface-card" title={cardTitle} styles={{ body: { padding: 0 } }}>
      <Table<T> size="middle" {...props} />
    </Card>
  );
}
