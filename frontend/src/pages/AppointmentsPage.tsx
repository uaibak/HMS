import { App, Button, Card, DatePicker, Descriptions, Form, Input, Modal, Select, Space, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { cancelAppointment, createAppointment, getAppointments, getDoctors, getPatients, updateAppointment } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';
import { formatLocalDateTime } from '../utils/dateTime';
import { formatShortId } from '../utils/idFormat';
import { PageHeader } from '../components/common/PageHeader';
import { DataTableWrapper } from '../components/common/DataTableWrapper';
import { SearchFilterBar } from '../components/common/SearchFilterBar';

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
  cnic: string;
  phone: string;
  bloodGroup: string;
};

export function AppointmentsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const isDoctor = user?.role === 'DOCTOR';
  const canSchedule = can(user?.role, 'appointments', 'create');
  const canCancel = can(user?.role, 'appointments', 'cancel');
  const canReschedule = can(user?.role, 'appointments', 'reschedule') || can(user?.role, 'appointments', 'update');
  const canMarkCompleted = can(user?.role, 'appointments', 'reschedule') || can(user?.role, 'appointments', 'update');

  async function load(p = page) {
    try {
      setTableLoading(true);
      const res = await getAppointments(p, 10);
      setRows(res.data);
      setTotal(res.total);
      setPage(p);
    } catch {
      message.error('Unable to load appointments');
    } finally {
      setTableLoading(false);
    }
  }

  async function loadDoctors() {
    if (isDoctor) {
      return;
    }
    try {
      setDoctorsLoading(true);
      const res = await getDoctors(1, 100);
      setDoctorOptions(res.data);
    } catch {
      message.error('Unable to load doctors');
    } finally {
      setDoctorsLoading(false);
    }
  }

  async function searchPatients(search = '') {
    try {
      setPatientsLoading(true);
      const res = await getPatients({ page: 1, limit: 50, search });
      setPatientOptions(res.data);
    } catch {
      message.error('Unable to load patients');
    } finally {
      setPatientsLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    searchPatients();
    loadDoctors();
  }, []);

  function openCreateModal() {
    setEditing(null);
    setSelectedPatient(null);
    setOpen(true);
    form.resetFields();

    // Doctors should never change ownership; keep doctor self-reference auto-filled.
    if (isDoctor && user?.doctorId) {
      form.setFieldsValue({ doctorId: user.doctorId });
    }
  }

  function openEditModal(record: any) {
    setEditing(record);
    setOpen(true);

    const patient = {
      id: record.patient?.id,
      firstName: record.patient?.firstName,
      lastName: record.patient?.lastName,
      cnic: record.patient?.cnic,
      phone: record.patient?.phone,
      bloodGroup: record.patient?.bloodGroup,
    };
    setSelectedPatient(patient);

    form.setFieldsValue({
      patientId: record.patient?.id,
      doctorId: record.doctor?.id,
      appointmentDate: dayjs(record.appointmentDate),
      reason: record.reason,
    });
  }

  async function submit() {
    let shouldReload = false;
    try {
      setSaving(true);
      const values = await form.validateFields();

      if (editing) {
        const payload = {
          appointmentDate: values.appointmentDate.toISOString(),
          reason: values.reason,
        };
        await updateAppointment(editing.id, payload);
        shouldReload = true;
        message.success('Appointment updated');
      } else {
        const payload = {
          patientId: values.patientId,
          doctorId: isDoctor ? user?.doctorId : values.doctorId,
          appointmentDate: values.appointmentDate.toISOString(),
          reason: values.reason,
        };
        await createAppointment(payload);
        shouldReload = true;
        message.success('Appointment created');
      }

      setOpen(false);
      setEditing(null);
      setSelectedPatient(null);
      form.resetFields();
    } catch {
      message.error('Unable to save appointment');
    } finally {
      if (shouldReload) {
        await load(page);
      }
      setSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      { title: 'Patient', render: (_: unknown, r: any) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}` },
      { title: 'Doctor', render: (_: unknown, r: any) => `${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}` },
      { title: 'Date', render: (_: unknown, r: any) => formatLocalDateTime(r.appointmentDate) },
      { title: 'Status', dataIndex: 'status' },
      {
        title: 'Actions',
        render: (_: unknown, r: any) => (
          <Space>
            {canReschedule && r.status === 'BOOKED' && (!isDoctor || r.doctorId === user?.doctorId) ? (
              <Button onClick={() => openEditModal(r)}>Reschedule</Button>
            ) : null}
            {canMarkCompleted && r.status === 'BOOKED' && (!isDoctor || r.doctorId === user?.doctorId) ? (
              <Button
                type="default"
                loading={actionLoadingId === r.id}
                onClick={async () => {
                  try {
                    setActionLoadingId(r.id);
                    await updateAppointment(r.id, { status: 'COMPLETED' });
                    message.success('Appointment marked completed');
                  } catch {
                    message.error('Unable to mark appointment completed');
                  } finally {
                    await load(page);
                    setActionLoadingId(null);
                  }
                }}
              >
                Mark Completed
              </Button>
            ) : null}
            {canCancel && r.status === 'BOOKED' ? (
              <Button
                danger
                onClick={async () => {
                  try {
                    await cancelAppointment(r.id);
                    message.success('Appointment cancelled');
                  } catch {
                    message.error('Unable to cancel appointment');
                  } finally {
                    await load(page);
                  }
                }}
              >
                Cancel
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [isDoctor, page],
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Appointments"
        subtitle="Book, reschedule, complete, and monitor consultation flow."
        roleTag={isDoctor ? 'Doctor Scope' : undefined}
      />
      <SearchFilterBar
        placeholder="Search appointments"
        actions={
          canSchedule
            ? <Button type="primary" onClick={openCreateModal}>Schedule</Button>
            : <Tag color="default">Read-only create permissions</Tag>
        }
      />
      <DataTableWrapper
        rowKey="id"
        loading={tableLoading}
        dataSource={rows}
        pagination={{ current: page, total, onChange: load }}
        columns={columns}
      />

      <Modal
        open={open}
        title={editing ? 'Reschedule Appointment' : 'Book Appointment'}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          setSelectedPatient(null);
        }}
        onOk={submit}
        okButtonProps={{ loading: saving }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Please select a patient' }]}>
            <Select
              disabled={!!editing}
              showSearch
              loading={patientsLoading}
              placeholder="Search by patient name or CNIC"
              filterOption={false}
              onSearch={(value) => searchPatients(value)}
              onChange={(id: string) => {
                const patient = patientOptions.find((x) => x.id === id) || null;
                // Auto-fill patient summary after selection for doctor referrals.
                setSelectedPatient(patient);
              }}
              options={patientOptions.map((p) => ({
                label: `${formatShortId(p.id, 'PAT')} | ${p.firstName} ${p.lastName} (${p.cnic})`,
                value: p.id,
              }))}
            />
          </Form.Item>

          {selectedPatient ? (
            <Card size="small" style={{ marginBottom: 12 }}>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Patient ID">{formatShortId(selectedPatient.id, 'PAT')}</Descriptions.Item>
                <Descriptions.Item label="Name">{selectedPatient.firstName} {selectedPatient.lastName}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedPatient.phone}</Descriptions.Item>
                <Descriptions.Item label="Blood Group">{selectedPatient.bloodGroup}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : null}

          <Form.Item name="doctorId" label="Doctor" rules={[{ required: true, message: 'Please select a doctor' }]}>
            <Select
              disabled={isDoctor || !!editing}
              loading={doctorsLoading}
              options={
                isDoctor
                  ? [{ label: `${user?.firstName} ${user?.lastName} (Self)`, value: user?.doctorId }]
                  : doctorOptions.map((d) => ({ label: `${d.firstName} ${d.lastName} - ${d.specialization}`, value: d.id }))
              }
            />
          </Form.Item>

          <Form.Item name="appointmentDate" label="Appointment Date" rules={[{ required: true, message: 'Please select appointment date/time' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please enter reason' }]}>
            <Input />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
}
