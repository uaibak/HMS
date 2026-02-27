import { Alert, Card, Col, Empty, Row, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardSummary } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';

export function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getDashboardSummary()
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load report analytics');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <PageHeader title="Reports" subtitle="Visual analytics across patients, revenue, and lab operations." />
      {loading ? <Skeleton active paragraph={{ rows: 6 }} /> : null}
      {!loading && error ? <Alert type="error" showIcon message={error} /> : null}
      <Row gutter={16}>
        <Col span={12}>
          <Card className="surface-card" title="Core KPIs">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name: 'Patients', value: summary?.patientCount || 0 },
                { name: 'Appointments', value: summary?.appointmentCount || 0 },
                { name: 'Revenue', value: summary?.revenue || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="surface-card" title="Lab Status Summary">
            {(summary?.labSummary || []).length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie dataKey="_count._all" nameKey="sampleStatus" data={summary?.labSummary || []} outerRadius={90} fill="#13c2c2" label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No lab report data" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
