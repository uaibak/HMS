import { Card, Col, Row, Statistic, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/api';

export function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    getDashboardSummary().then(setSummary);
  }, []);

  return (
    <div>
      <Typography.Title level={3}>Dashboard</Typography.Title>
      <Row gutter={16}>
        <Col span={8}><Card><Statistic title="Patients" value={summary?.patientCount ?? 0} /></Card></Col>
        <Col span={8}><Card><Statistic title="Appointments" value={summary?.appointmentCount ?? 0} /></Card></Col>
        <Col span={8}><Card><Statistic title="Revenue" value={summary?.revenue ?? 0} prefix="PKR" /></Card></Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="Low Stock Medicines">
        <Table
          rowKey="id"
          dataSource={summary?.lowStockMedicines || []}
          pagination={false}
          columns={[
            { title: 'Medicine', dataIndex: 'name' },
            { title: 'Batch', dataIndex: 'batchNo' },
            { title: 'Stock', dataIndex: 'stock' },
          ]}
        />
      </Card>
    </div>
  );
}
