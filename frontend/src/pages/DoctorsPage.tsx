import { Button, Form, Input, Modal, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { createDoctor, deleteDoctor, getDoctors, updateDoctor } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';

export function DoctorsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const canManageDoctors = can(user?.role, 'doctors', 'create');

  async function load(p = page) {
    const res = await getDoctors(p, 10);
    setRows(res.data);
    setTotal(res.total);
    setPage(p);
  }

  useEffect(() => { load(1); }, []);

  async function submit() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      availability: { slots: [{ day: 'Monday', from: values.from || '09:00', to: values.to || '13:00' }] },
    };
    delete payload.from;
    delete payload.to;
    if (editing) await updateDoctor(editing.id, payload);
    else await createDoctor(payload);
    setOpen(false);
    setEditing(null);
    form.resetFields();
    load(page);
  }

  return (
    <div>
      <Typography.Title level={3}>Doctor Management</Typography.Title>
      {canManageDoctors ? <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Add Doctor</Button> : null}
      <Table
        rowKey="id"
        dataSource={rows}
        pagination={{ current: page, total, onChange: load }}
        columns={[
          { title: 'Name', render: (_, r) => `${r.firstName} ${r.lastName}` },
          { title: 'Specialization', dataIndex: 'specialization' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Phone', dataIndex: 'phone' },
          {
            title: 'Actions',
            render: (_, r) => (
              canManageDoctors ? (
                <Space>
                  <Button onClick={() => { setEditing(r); setOpen(true); form.setFieldsValue(r); }}>Edit</Button>
                  <Button danger onClick={async () => { await deleteDoctor(r.id); load(page); }}>Delete</Button>
                </Space>
              ) : 'View Only'
            ),
          },
        ]}
      />
      <Modal open={open} title={editing ? 'Edit Doctor' : 'Add Doctor'} onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specialization" label="Specialization" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="from" label="Availability From"><Input placeholder="09:00" /></Form.Item>
          <Form.Item name="to" label="Availability To"><Input placeholder="13:00" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
