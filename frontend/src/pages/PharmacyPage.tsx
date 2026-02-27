import { Button, DatePicker, Form, Input, InputNumber, Modal, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { createMedicine, getMedicines } from '../services/api';

export function PharmacyPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const res = await getMedicines(1, 50);
    setRows(res.data);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    const values = await form.validateFields();
    await createMedicine({ ...values, expiryDate: values.expiryDate.format('YYYY-MM-DD') });
    setOpen(false);
    form.resetFields();
    load();
  }

  return (
    <div>
      <Typography.Title level={3}>Pharmacy</Typography.Title>
      <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Add Medicine</Button>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Batch', dataIndex: 'batchNo' },
          { title: 'Expiry', dataIndex: 'expiryDate' },
          { title: 'Stock', dataIndex: 'stock' },
          { title: 'Unit Price', dataIndex: 'unitPrice' },
        ]}
      />
      <Modal open={open} title="Add Medicine" onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="genericName" label="Generic Name"><Input /></Form.Item>
          <Form.Item name="batchNo" label="Batch No" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="expiryDate" label="Expiry Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="unitPrice" label="Unit Price" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
