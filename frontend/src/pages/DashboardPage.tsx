import { Alert, Card, Col, Row, Skeleton, Table } from 'antd';
import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';

export function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live overview of patient load, appointments, revenue and inventory risk."
      />

      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><StatCard label="Total Patients" value={summary?.patientCount ?? 0} tone="info" /></Col>
        <Col xs={24} md={8}><StatCard label="Appointments" value={summary?.appointmentCount ?? 0} tone="success" /></Col>
        <Col xs={24} md={8}><StatCard label="Revenue" value={summary?.revenue ?? 0} suffix="PKR" tone="warning" /></Col>
      </Row>

      {(summary?.lowStockMedicines || []).length ? (
        <Alert
          type="warning"
          showIcon
          message={`Low stock alert: ${summary.lowStockMedicines.length} medicine(s) need replenishment.`}
        />
      ) : null}

      <Card className="surface-card" title="Low Stock Medicines">
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
