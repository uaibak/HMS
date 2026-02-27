import { App, Button, Form, Input, Modal, Select, Space } from 'antd';
import { useEffect, useState } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import { DataTableWrapper } from '../components/common/DataTableWrapper';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { ConfirmActionButton } from '../components/common/ConfirmActionButton';

export function UsersPage() {
  const { message } = App.useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  async function load(p = page) {
    try {
      setTableLoading(true);
      const res = await getUsers(p, 10);
      setRows(res.data);
      setTotal(res.total);
      setPage(p);
    } catch {
      message.error('Unable to load users');
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  async function submit() {
    let shouldReload = false;
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) await updateUser(editing.id, values);
      else await createUser(values);
      shouldReload = true;
      message.success('User saved successfully');
      form.resetFields();
      setOpen(false);
      setEditing(null);
    } catch {
      message.error('Unable to save user');
    } finally {
      if (shouldReload) {
        await load(page);
      }
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title="User Management" subtitle="Manage hospital staff accounts and role assignments." />
      <SearchFilterBar
        placeholder="Search by name or email"
        actions={<Button type="primary" onClick={() => setOpen(true)}>Add User</Button>}
      />
      <DataTableWrapper
        rowKey="id"
        loading={tableLoading}
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
                <ConfirmActionButton
                  danger
                  loading={deletingId === r.id}
                  title="Delete this user?"
                  onConfirm={async () => {
                    try {
                      setDeletingId(r.id);
                      await deleteUser(r.id);
                      message.success('User removed');
                    } catch {
                      message.error('Unable to remove user');
                    } finally {
                      await load(page);
                      setDeletingId(null);
                    }
                  }}
                >
                  Delete
                </ConfirmActionButton>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        open={open}
        onCancel={() => { setOpen(false); setEditing(null); }}
        onOk={submit}
        okButtonProps={{ loading: saving }}
        title={editing ? 'Edit User' : 'Add User'}
      >
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
