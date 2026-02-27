import { Button, DatePicker, Form, Input, Modal, Select, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { createPatient, deletePatient, getDoctors, getPatients, updatePatient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';

export function PatientsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form] = Form.useForm();
  const canManagePatients = can(user?.role, 'patients', 'create');

  async function load(p = page, s = search) {
    const res = await getPatients({ page: p, limit: 10, search: s });
    setRows(res.data);
    setTotal(res.total);
    setPage(p);
  }

  useEffect(() => { load(1); }, []);
  useEffect(() => {
    getDoctors(1, 100).then((res) => setDoctors(res.data)).catch(() => undefined);
  }, []);

  async function submit() {
    const values = await form.validateFields();
    const payload = { ...values, dob: values.dob.format('YYYY-MM-DD') };
    if (editing) await updatePatient(editing.id, payload);
    else await createPatient(payload);
    setOpen(false);
    setEditing(null);
    form.resetFields();
    load(page);
  }

  return (
    <div>
      <Typography.Title level={3}>Patient Management</Typography.Title>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder="Search by name or CNIC"
          onSearch={(value) => { setSearch(value); load(1, value); }}
          style={{ width: 280 }}
        />
        {canManagePatients ? <Button type="primary" onClick={() => setOpen(true)}>Add Patient</Button> : null}
      </Space>
      <Table
        rowKey="id"
        dataSource={rows}
        pagination={{ current: page, total, onChange: (nextPage) => load(nextPage, search) }}
        columns={[
          { title: 'Name', render: (_, r) => `${r.firstName} ${r.lastName}` },
          { title: 'CNIC', dataIndex: 'cnic' },
          { title: 'Blood Group', dataIndex: 'bloodGroup' },
          { title: 'Phone', dataIndex: 'phone' },
          {
            title: 'Actions',
            render: (_, r) => (
              canManagePatients ? (
                <Space>
                  <Button onClick={() => { setEditing(r); setOpen(true); form.setFieldsValue({ ...r, dob: dayjs(r.dob) }); }}>Edit</Button>
                  <Button danger onClick={async () => { await deletePatient(r.id); load(page); }}>Delete</Button>
                </Space>
              ) : 'View Only'
            ),
          },
        ]}
      />
      <Modal open={open} title={editing ? 'Edit Patient' : 'Add Patient'} onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="cnic" label="CNIC" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="dob" label="Date of Birth" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="bloodGroup" label="Blood Group" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="assignedDoctorId" label="Assigned Doctor">
            <Select
              showSearch
              allowClear
              placeholder="Select assigned doctor"
              optionFilterProp="label"
              options={doctors.map((d) => ({
                value: d.id,
                label: `${d.firstName} ${d.lastName} (${d.specialization})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
