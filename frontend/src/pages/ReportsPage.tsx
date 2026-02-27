import { Card, Col, Row, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboardSummary } from '../services/api';

export function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    getDashboardSummary().then(setSummary);
  }, []);

  return (
    <div>
      <Typography.Title level={3}>Reports</Typography.Title>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Core KPIs">
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
          <Card title="Lab Status Summary">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie dataKey="_count._all" nameKey="sampleStatus" data={summary?.labSummary || []} outerRadius={90} fill="#13c2c2" label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
