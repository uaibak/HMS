import { Alert, Button, Card, Col, Empty, Progress, Row, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getAppointments, getDashboardSummary, getEncounters, getLabOrders, getPharmacyTransactions } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { formatLocalDateTime } from '../utils/dateTime';
import { formatShortId } from '../utils/idFormat';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';

type DashboardSummary = {
  patientCount: number;
  appointmentCount: number;
  revenue: number;
  lowStockMedicines: Array<{ id: string; name: string; batchNo: string; stock: number }>;
  labSummary: Array<{ sampleStatus: string; _count: { _all: number } }>;
  medicineStockSnapshot: Array<{
    id: string;
    name: string;
    batchNo: string;
    stock: number;
    unitPrice: number;
    expiryDate: string;
  }>;
};

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentLabOrders, setRecentLabOrders] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [openEncounters, setOpenEncounters] = useState(0);
  const [hasModuleWarnings, setHasModuleWarnings] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      setLoadError(null);
      setHasModuleWarnings(false);

      const canSeeAppointments = can(user?.role, 'appointments', 'view');
      const canSeeLab = can(user?.role, 'lab', 'view') || can(user?.role, 'lab', 'create');
      const canSeePharmacy = can(user?.role, 'pharmacy', 'view');
      const canSeeBilling = can(user?.role, 'billing', 'view');

      const tasks: Promise<unknown>[] = [
        getDashboardSummary(),
        canSeeAppointments ? getAppointments(1, 5) : Promise.resolve(null),
        canSeeLab ? getLabOrders(1, 5) : Promise.resolve(null),
        canSeePharmacy ? getPharmacyTransactions(1, 5) : Promise.resolve(null),
        canSeeBilling ? getEncounters(1, 50) : Promise.resolve(null),
      ];

      const [summaryRes, apptRes, labRes, txRes, encountersRes] = await Promise.allSettled(tasks);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value as DashboardSummary);
      } else {
        setLoadError('Unable to load dashboard summary.');
      }

      const hadAnySecondaryFailure =
        (canSeeAppointments && apptRes.status === 'rejected') ||
        (canSeeLab && labRes.status === 'rejected') ||
        (canSeePharmacy && txRes.status === 'rejected') ||
        (canSeeBilling && encountersRes.status === 'rejected');
      setHasModuleWarnings(hadAnySecondaryFailure);

      setRecentAppointments(
        apptRes.status === 'fulfilled' && apptRes.value ? (apptRes.value as any).data || [] : [],
      );
      setRecentLabOrders(
        labRes.status === 'fulfilled' && labRes.value ? (labRes.value as any).data || [] : [],
      );
      setRecentTransactions(
        txRes.status === 'fulfilled' && txRes.value ? (txRes.value as any) || [] : [],
      );

      if (encountersRes.status === 'fulfilled' && encountersRes.value) {
        const encounterRows = (encountersRes.value as any).data || [];
        setOpenEncounters(encounterRows.filter((row: any) => row.status === 'OPEN').length);
      } else {
        setOpenEncounters(0);
      }

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user?.role]);

  const labTotal = (summary?.labSummary || []).reduce((sum, item) => sum + item._count._all, 0);
  const labCompleted = (summary?.labSummary || []).find((x) => x.sampleStatus === 'COMPLETED')?._count._all || 0;
  const completedPct = labTotal > 0 ? Math.round((labCompleted / labTotal) * 100) : 0;

  return (
    <div className="page-shell">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live overview of patient load, appointments, revenue and inventory risk."
        extra={(
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadDashboard}>
            Refresh
          </Button>
        )}
      />

      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : null}
      {!loading && loadError ? <Alert type="error" showIcon message={loadError} /> : null}
      {!loading && hasModuleWarnings ? (
        <Alert
          type="warning"
          showIcon
          message="Some module widgets could not be loaded for your role or current data state."
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}><StatCard label="Total Patients" value={summary?.patientCount ?? 0} tone="info" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard label="Appointments" value={summary?.appointmentCount ?? 0} tone="success" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard label="Revenue Collected" value={summary?.revenue ?? 0} suffix="PKR" tone="warning" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard label="Open Encounters" value={openEncounters} tone="default" /></Col>
      </Row>

      {(summary?.lowStockMedicines || []).length ? (
        <Alert
          type="warning"
          showIcon
          message={`Low stock alert: ${summary?.lowStockMedicines?.length || 0} medicine(s) need replenishment.`}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="surface-card" title="Recent Appointments">
            <Table
              rowKey="id"
              dataSource={recentAppointments}
              pagination={false}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent appointments" /> }}
              columns={[
                { title: 'Patient', render: (_, r) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}` },
                { title: 'Date/Time', render: (_, r) => formatLocalDateTime(r.appointmentDate) },
                { title: 'Status', render: (_, r) => <Tag>{r.status}</Tag> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="surface-card" title="Lab Progress">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Progress percent={completedPct} status="active" />
              <Typography.Text type="secondary">
                Completed {labCompleted} of {labTotal} lab orders
              </Typography.Text>
              <Table
                rowKey="sampleStatus"
                size="small"
                pagination={false}
                dataSource={(summary?.labSummary || []).map((item) => ({
                  sampleStatus: item.sampleStatus,
                  count: item._count._all,
                }))}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No lab activity" /> }}
                columns={[
                  { title: 'Status', dataIndex: 'sampleStatus' },
                  { title: 'Count', dataIndex: 'count' },
                ]}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="surface-card" title="Pharmacy Stock Snapshot">
            <Table
              rowKey="id"
              dataSource={summary?.medicineStockSnapshot || []}
              pagination={false}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pharmacy stock data" /> }}
              columns={[
                { title: 'Medicine', dataIndex: 'name' },
                { title: 'Batch', dataIndex: 'batchNo' },
                { title: 'Stock', dataIndex: 'stock' },
                { title: 'Unit Price', dataIndex: 'unitPrice' },
                { title: 'Expiry', render: (_, r) => formatLocalDateTime(r.expiryDate) },
                {
                  title: 'Level',
                  render: (_, r) =>
                    r.stock < 20 ? <Tag color="volcano">Low</Tag> : <Tag color="green">Healthy</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="surface-card" title="Recent Lab & Pharmacy Activity">
            <Table
              rowKey={(row) => row.key}
              pagination={false}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent activity" /> }}
              dataSource={[
                ...recentLabOrders.map((row) => ({
                  key: `lab-${row.id}`,
                  stream: 'LAB',
                  reference: formatShortId(row.id, 'LBO'),
                  subject: `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}`.trim() || '-',
                  status: row.sampleStatus,
                  whenTs: new Date(row.orderedAt).getTime(),
                  when: formatLocalDateTime(row.orderedAt),
                })),
                ...recentTransactions.map((row) => ({
                  key: `ph-${row.id}`,
                  stream: 'PHARMACY',
                  reference: formatShortId(row.id, 'PTX'),
                  subject: row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '-',
                  status: row.type,
                  whenTs: new Date(row.transactionDate).getTime(),
                  when: formatLocalDateTime(row.transactionDate),
                })),
              ]
                .sort((a, b) => b.whenTs - a.whenTs)
                .slice(0, 8)}
              columns={[
                { title: 'Module', dataIndex: 'stream', render: (value) => <Tag color={value === 'LAB' ? 'blue' : 'green'}>{value}</Tag> },
                { title: 'Ref', dataIndex: 'reference' },
                { title: 'Patient', dataIndex: 'subject' },
                { title: 'Status', dataIndex: 'status' },
                { title: 'Date/Time', dataIndex: 'when' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
