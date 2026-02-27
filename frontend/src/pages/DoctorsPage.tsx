import { App, Button, Form, Input, Modal, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { createDoctor, deleteDoctor, getDoctors, updateDoctor } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';
import { PageHeader } from '../components/common/PageHeader';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTableWrapper } from '../components/common/DataTableWrapper';
import { ConfirmActionButton } from '../components/common/ConfirmActionButton';

export function DoctorsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const canManageDoctors = can(user?.role, 'doctors', 'create');

  async function load(p = page) {
    try {
      setTableLoading(true);
      const res = await getDoctors(p, 10);
      setRows(res.data);
      setTotal(res.total);
      setPage(p);
    } catch {
      message.error('Unable to load doctors');
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  async function submit() {
    let shouldReload = false;
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        availability: { slots: [{ day: 'Monday', from: values.from || '09:00', to: values.to || '13:00' }] },
      };
      delete payload.from;
      delete payload.to;
      setSaving(true);
      if (editing) await updateDoctor(editing.id, payload);
      else await createDoctor(payload);
      shouldReload = true;
      message.success('Doctor profile saved');
      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch {
      message.error('Unable to save doctor');
    } finally {
      if (shouldReload) {
        await load(page);
      }
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Doctor Management"
        subtitle="Schedules, specializations, and provider directory."
        roleTag={!canManageDoctors ? 'View Only' : undefined}
      />
      <SearchFilterBar
        placeholder="Search by doctor name or specialization"
        actions={
          canManageDoctors
            ? <Button type="primary" onClick={() => setOpen(true)}>Add Doctor</Button>
            : <Tag color="default">Read-only access</Tag>
        }
      />
      <DataTableWrapper
        rowKey="id"
        loading={tableLoading}
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
                  <ConfirmActionButton
                    danger
                    loading={deletingId === r.id}
                    title="Delete this doctor?"
                    onConfirm={async () => {
                      try {
                        setDeletingId(r.id);
                        await deleteDoctor(r.id);
                        message.success('Doctor removed');
                      } catch {
                        message.error('Unable to remove doctor');
                      } finally {
                        await load(page);
                        setDeletingId(null);
                      }
                    }}
                  >
                    Delete
                  </ConfirmActionButton>
                </Space>
              ) : 'View Only'
            ),
          },
        ]}
      />
      <Modal
        open={open}
        title={editing ? 'Edit Doctor' : 'Add Doctor'}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okButtonProps={{ loading: saving }}
      >
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
