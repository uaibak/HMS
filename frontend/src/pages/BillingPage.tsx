import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { createInvoice, getDoctors, getInvoices, getPatients, recordInvoicePayment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';

export function BillingPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const canCreateInvoice = can(user?.role, 'billing', 'create');
  const canRecordPayment = can(user?.role, 'billing', 'pay');

  async function load() {
    const res = await getInvoices(1, 50);
    setRows(res.data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    Promise.all([getPatients({ page: 1, limit: 100 }), getDoctors(1, 100)])
      .then(([patientsRes, doctorsRes]) => {
        setPatients(patientsRes.data);
        setDoctors(doctorsRes.data);
      })
      .catch(() => undefined);
  }, []);

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
      {canCreateInvoice ? <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Create Invoice</Button> : null}
      <Table
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Patient ID', dataIndex: 'patientId' },
          { title: 'Type', dataIndex: 'type' },
          { title: 'Amount', dataIndex: 'amount' },
          { title: 'Paid', dataIndex: 'paidAmount' },
          { title: 'Status', dataIndex: 'status' },
          {
            title: 'Actions',
            render: (_, r) => canRecordPayment ? <Button onClick={async () => { await recordInvoicePayment(r.id, 500); load(); }}>Add 500 Payment</Button> : 'View Only',
          },
        ]}
      />
      <Modal open={open} title="Create Invoice" onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Please select a patient' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search patient by name/CNIC"
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName} (${p.cnic})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="doctorId" label="Doctor">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select doctor (optional)"
              options={doctors.map((d) => ({
                value: d.id,
                label: `${d.firstName} ${d.lastName} (${d.specialization})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}><Select options={['OPD','IPD','LAB','PHARMACY'].map((x)=>({label:x,value:x}))} /></Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
