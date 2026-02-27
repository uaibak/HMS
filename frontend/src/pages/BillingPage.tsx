import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { createInvoice, getInvoices, recordInvoicePayment } from '../services/api';

export function BillingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  async function load() {
    const res = await getInvoices(1, 50);
    setRows(res);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    const values = await form.validateFields();
    await createInvoice(values);
    setOpen(false);
    form.resetFields();
    load();
  }

  return (
    <div>
      <Typography.Title level={3}>Billing</Typography.Title>
      <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Create Invoice</Button>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Patient ID', dataIndex: 'patientId' },
          { title: 'Type', dataIndex: 'type' },
          { title: 'Amount', dataIndex: 'amount' },
          { title: 'Paid', dataIndex: 'paidAmount' },
          { title: 'Status', dataIndex: 'status' },
          { title: 'Actions', render: (_, r) => <Button onClick={async () => { await recordInvoicePayment(r.id, 500); load(); }}>Add 500 Payment</Button> },
        ]}
      />
      <Modal open={open} title="Create Invoice" onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="doctorId" label="Doctor ID"><Input /></Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}><Select options={['OPD','IPD','LAB','PHARMACY'].map((x)=>({label:x,value:x}))} /></Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
