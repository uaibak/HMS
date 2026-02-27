import { Button, DatePicker, Form, Input, Modal, Select, Space, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { cancelAppointment, createAppointment, getAppointments, updateAppointment } from '../services/api';

export function AppointmentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  async function load(p = page) {
    const res = await getAppointments(p, 10);
    setRows(res.data);
    setTotal(res.total);
    setPage(p);
  }

  useEffect(() => { load(1); }, []);

  async function submit() {
    const values = await form.validateFields();
    const payload = { ...values, appointmentDate: values.appointmentDate.toISOString() };
    if (editing) await updateAppointment(editing.id, payload);
    else await createAppointment(payload);
    setOpen(false);
    setEditing(null);
    form.resetFields();
    load(page);
  }

  return (
    <div>
      <Typography.Title level={3}>Appointments</Typography.Title>
      <Button type="primary" onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Schedule</Button>
      <Table
        rowKey="id"
        dataSource={rows}
        pagination={{ current: page, total, onChange: load }}
        columns={[
          { title: 'Patient', render: (_, r) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}` },
          { title: 'Doctor', render: (_, r) => `${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}` },
          { title: 'Date', render: (_, r) => dayjs(r.appointmentDate).format('YYYY-MM-DD HH:mm') },
          { title: 'Status', dataIndex: 'status' },
          {
            title: 'Actions',
            render: (_, r) => (
              <Space>
                <Button onClick={() => { setEditing(r); setOpen(true); form.setFieldsValue({ ...r, appointmentDate: dayjs(r.appointmentDate) }); }}>Reschedule</Button>
                <Button danger onClick={async () => { await cancelAppointment(r.id); load(page); }}>Cancel</Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal open={open} title={editing ? 'Reschedule Appointment' : 'Book Appointment'} onCancel={() => setOpen(false)} onOk={submit}>
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="doctorId" label="Doctor ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="appointmentDate" label="Appointment Date" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="reason" label="Reason"><Input /></Form.Item>
          <Form.Item name="status" label="Status"><Select options={['BOOKED','COMPLETED','CANCELLED'].map((x)=>({label:x,value:x}))} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
