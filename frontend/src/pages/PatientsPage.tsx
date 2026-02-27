import { App, Button, DatePicker, Form, Input, Modal, Select, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { createPatient, deletePatient, getDoctors, getPatients, updatePatient } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';
import { PageHeader } from '../components/common/PageHeader';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTableWrapper } from '../components/common/DataTableWrapper';
import { ConfirmActionButton } from '../components/common/ConfirmActionButton';

export function PatientsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const canManagePatients = can(user?.role, 'patients', 'create');

  async function load(p = page, s = search) {
    try {
      setTableLoading(true);
      const res = await getPatients({ page: p, limit: 10, search: s });
      setRows(res.data);
      setTotal(res.total);
      setPage(p);
    } catch {
      message.error('Unable to load patients');
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);
  useEffect(() => {
    getDoctors(1, 100).then((res) => setDoctors(res.data)).catch(() => undefined);
  }, []);

  async function submit() {
    let shouldReload = false;
    try {
      const values = await form.validateFields();
      const payload = { ...values, dob: values.dob.format('YYYY-MM-DD') };
      setSaving(true);
      if (editing) await updatePatient(editing.id, payload);
      else await createPatient(payload);
      shouldReload = true;
      message.success('Patient record saved');
      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch {
      message.error('Unable to save patient');
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
        title="Patient Management"
        subtitle="Unified patient demographics, assignment, and care context."
        roleTag={!canManagePatients ? 'View Only' : undefined}
      />
      <SearchFilterBar
        placeholder="Search by patient name or CNIC"
        onSearch={(value) => { setSearch(value); load(1, value); }}
        actions={canManagePatients ? <Button type="primary" onClick={() => setOpen(true)}>Add Patient</Button> : <Tag color="default">Read-only access</Tag>}
      />
      <DataTableWrapper
        rowKey="id"
        loading={tableLoading}
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
                  <ConfirmActionButton
                    danger
                    loading={deletingId === r.id}
                    title="Delete this patient?"
                    onConfirm={async () => {
                      try {
                        setDeletingId(r.id);
                        await deletePatient(r.id);
                        message.success('Patient removed');
                      } catch {
                        message.error('Unable to remove patient');
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
        title={editing ? 'Edit Patient' : 'Add Patient'}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okButtonProps={{ loading: saving }}
      >
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
