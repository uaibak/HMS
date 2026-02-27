import { Button, Form, Input, Modal, Select, Space, Table, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '../services/api';

export function UsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  async function load(p = page) {
    const res = await getUsers(p, 10);
    setRows(res.data);
    setTotal(res.total);
    setPage(p);
  }

  useEffect(() => {
    load(1);
  }, []);

  async function submit() {
    const values = await form.validateFields();
    if (editing) await updateUser(editing.id, values);
    else await createUser(values);
    message.success('Saved');
    form.resetFields();
    setOpen(false);
    setEditing(null);
    load(page);
  }

  return (
    <div>
      <Typography.Title level={3}>User Management</Typography.Title>
      <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Add User</Button>
      <Table
        rowKey="id"
        dataSource={rows}
        pagination={{ current: page, total, onChange: load }}
        columns={[
          { title: 'Name', render: (_, r) => `${r.firstName} ${r.lastName}` },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Role', render: (_, r) => r.role?.name },
          {
            title: 'Actions',
            render: (_, r) => (
              <Space>
                <Button onClick={() => { setEditing(r); setOpen(true); form.setFieldsValue({ ...r, role: r.role?.name, password: '' }); }}>Edit</Button>
                <Button danger onClick={async () => { await deleteUser(r.id); load(page); }}>Delete</Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal open={open} onCancel={() => { setOpen(false); setEditing(null); }} onOk={submit} title={editing ? 'Edit User' : 'Add User'}>
        <Form form={form} layout="vertical">
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: !editing }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={['ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST'].map((x) => ({ label: x, value: x }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
