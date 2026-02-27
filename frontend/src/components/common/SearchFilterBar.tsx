import { Button, Input, Space } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

export function SearchFilterBar({
  placeholder,
  onSearch,
  actions,
}: {
  placeholder?: string;
  onSearch?: (value: string) => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="section-toolbar">
      <Space>
        <Input.Search
          allowClear
          prefix={<SearchOutlined />}
          placeholder={placeholder || 'Search'}
          style={{ width: 320 }}
          onSearch={onSearch}
        />
        <Button icon={<FilterOutlined />} disabled>
          Filters
        </Button>
      </Space>
      <Space>{actions}</Space>
    </div>
  );
}
