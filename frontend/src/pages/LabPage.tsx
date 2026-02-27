import { Button, Form, Input, Modal, Select, Space, Table, Tabs, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { createLabOrder, getLabOrders, getLabTests } from '../services/api';

export function LabPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const [ordersRes, testsRes] = await Promise.all([getLabOrders(1, 50), getLabTests(1, 50)]);
    setOrders(ordersRes);
    setTests(testsRes);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    const values = await form.validateFields();
    await createLabOrder(values);
    setOpen(false);
    form.resetFields();
    load();
  }

  return (
    <div>
      <Typography.Title level={3}>Lab</Typography.Title>
      <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Create Lab Order</Button>
      <Tabs
        items={[
          {
            key: 'orders',
            label: 'Lab Orders',
            children: (
              <Table rowKey="id" dataSource={orders} columns={[
                { title: 'Patient', render: (_, r) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}` },
                { title: 'Test', render: (_, r) => r.test?.name },
                { title: 'Status', dataIndex: 'sampleStatus' },
                { title: 'Result', dataIndex: 'resultText' },
              ]} />
            ),
          },
          {
            key: 'tests',
            label: 'Test Catalog',
            children: (
              <Table rowKey="id" dataSource={tests} columns={[
                { title: 'Name', dataIndex: 'name' },
                { title: 'Description', dataIndex: 'description' },
                { title: 'Price', dataIndex: 'price' },
              ]} />
            ),
          },
        ]}
      />
      <Modal open={open} title="Create Lab Order" onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="testId" label="Test ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="orderedById" label="Ordered By User ID"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
