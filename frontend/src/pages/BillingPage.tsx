import { App, Button, Card, Descriptions, Drawer, Form, Input, InputNumber, Modal, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
  closeEncounter,
  createInvoice,
  getDoctors,
  getEncounterById,
  getEncounters,
  getPatients,
  recordInvoicePayment,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';
import { formatRefId, formatShortId } from '../utils/idFormat';
import { PageHeader } from '../components/common/PageHeader';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTableWrapper } from '../components/common/DataTableWrapper';

export function BillingPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [form] = Form.useForm();

  const canCreateInvoice = can(user?.role, 'billing', 'create');
  const canRecordPayment = can(user?.role, 'billing', 'pay');

  async function load() {
    try {
      setTableLoading(true);
      const res = await getEncounters(1, 50);
      setRows(res.data);
    } catch {
      message.error('Unable to load encounters');
    } finally {
      setTableLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setMetaLoading(true);
    Promise.all([getPatients({ page: 1, limit: 100 }), getDoctors(1, 100)])
      .then(([patientsRes, doctorsRes]) => {
        setPatients(patientsRes.data);
        setDoctors(doctorsRes.data);
      })
      .catch(() => message.error('Unable to load billing metadata'))
      .finally(() => setMetaLoading(false));
  }, []);

  async function submitManualInvoice() {
    let shouldReload = false;
    try {
      setSavingInvoice(true);
      const values = await form.validateFields();
      await createInvoice(values);
      shouldReload = true;
      message.success('Manual invoice created');
      setOpen(false);
      form.resetFields();
    } catch {
      message.error('Unable to create invoice');
    } finally {
      if (shouldReload) {
        await load();
      }
      setSavingInvoice(false);
    }
  }

  async function openEncounterDetails(id: string) {
    try {
      setDetailLoading(true);
      const detail = await getEncounterById(id);
      setSelectedEncounter(detail);
      setDetailOpen(true);
    } catch {
      message.error('Unable to load encounter details');
    } finally {
      setDetailLoading(false);
    }
  }

  async function addQuickPayment(invoiceId: string) {
    try {
      setActionLoadingId(invoiceId);
      await recordInvoicePayment(invoiceId, 500);
      message.success('Payment recorded');
      if (selectedEncounter?.id) {
        const refreshed = await getEncounterById(selectedEncounter.id);
        setSelectedEncounter(refreshed);
      }
    } catch {
      message.error('Unable to record payment');
    } finally {
      await load();
      setActionLoadingId(null);
    }
  }

  async function handleCloseEncounter(encounterId: string) {
    try {
      setActionLoadingId(encounterId);
      await closeEncounter(encounterId);
      message.success('Encounter closed');
      if (selectedEncounter?.id === encounterId) {
        const refreshed = await getEncounterById(encounterId);
        setSelectedEncounter(refreshed);
      }
    } catch {
      message.error('Unable to close encounter');
    } finally {
      await load();
      setActionLoadingId(null);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title="Billing" subtitle="Consolidated encounter billing with line-item traceability." />
      <SearchFilterBar
        placeholder="Search encounters"
        actions={canCreateInvoice ? <Button type="primary" onClick={() => setOpen(true)}>Create Manual Invoice</Button> : null}
      />

      <DataTableWrapper
        rowKey="id"
        loading={tableLoading}
        dataSource={rows}
        columns={[
          { title: 'Encounter', render: (_, r) => formatShortId(r.id, 'ENC') },
          { title: 'Patient', render: (_, r) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}` },
          { title: 'Doctor', render: (_, r) => r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}` : '-' },
          {
            title: 'Status',
            render: (_, r) => <Tag color={r.status === 'OPEN' ? 'green' : 'default'}>{r.status}</Tag>,
          },
          { title: 'Subtotal', render: (_, r) => r.invoice?.subtotal ?? 0 },
          { title: 'Grand Total', render: (_, r) => r.invoice?.grandTotal ?? 0 },
          { title: 'Paid', render: (_, r) => r.invoice?.paidAmount ?? 0 },
          {
            title: 'Actions',
            render: (_, r) => (
              <Space>
                <Button onClick={() => openEncounterDetails(r.id)}>View</Button>
                {r.status === 'OPEN' && canCreateInvoice ? (
                  <Button loading={actionLoadingId === r.id} onClick={() => handleCloseEncounter(r.id)}>Close</Button>
                ) : null}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        width={760}
        title="Encounter Details"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailLoading ? (
          <Typography.Text type="secondary">Loading encounter details...</Typography.Text>
        ) : selectedEncounter ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card className="surface-card">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Encounter ID">{formatShortId(selectedEncounter.id, 'ENC')}</Descriptions.Item>
                <Descriptions.Item label="Status">{selectedEncounter.status}</Descriptions.Item>
                <Descriptions.Item label="Patient">{selectedEncounter.patient?.firstName} {selectedEncounter.patient?.lastName}</Descriptions.Item>
                <Descriptions.Item label="Doctor">{selectedEncounter.doctor ? `${selectedEncounter.doctor.firstName} ${selectedEncounter.doctor.lastName}` : '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <DataTableWrapper
              cardTitle="Invoice Lines"
              rowKey="id"
              pagination={false}
              dataSource={selectedEncounter.invoice?.lines || []}
              columns={[
                { title: 'Type', dataIndex: 'lineType' },
                { title: 'Source', render: (_: unknown, line: any) => formatRefId(line.referenceType, line.referenceId) },
                { title: 'Description', dataIndex: 'description' },
                { title: 'Qty', dataIndex: 'quantity' },
                { title: 'Unit Price', dataIndex: 'unitPrice' },
                { title: 'Total', dataIndex: 'lineTotal' },
              ]}
            />

            <Card className="surface-card" title="Totals">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Subtotal">{selectedEncounter.invoice?.subtotal ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Discount">{selectedEncounter.invoice?.discount ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Tax">{selectedEncounter.invoice?.tax ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Grand Total">{selectedEncounter.invoice?.grandTotal ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Paid">{selectedEncounter.invoice?.paidAmount ?? 0}</Descriptions.Item>
                <Descriptions.Item label="Due">
                  {(selectedEncounter.invoice?.grandTotal ?? 0) - (selectedEncounter.invoice?.paidAmount ?? 0)}
                </Descriptions.Item>
              </Descriptions>

              {selectedEncounter.invoice?.id && canRecordPayment ? (
                <Button
                  style={{ marginTop: 12 }}
                  loading={actionLoadingId === selectedEncounter.invoice.id}
                  onClick={() => addQuickPayment(selectedEncounter.invoice.id)}
                >
                  Add 500 Payment
                </Button>
              ) : null}
            </Card>
          </Space>
        ) : (
          <Typography.Text type="secondary">No encounter selected.</Typography.Text>
        )}
      </Drawer>

      <Modal
        open={open}
        title="Create Manual Invoice"
        onCancel={() => setOpen(false)}
        onOk={submitManualInvoice}
        okButtonProps={{ loading: savingInvoice }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Please select a patient' }]}>
            <Select
              showSearch
              loading={metaLoading}
              optionFilterProp="label"
              placeholder="Search patient by name/CNIC"
              options={patients.map((p) => ({
                value: p.id,
                label: `${formatShortId(p.id, 'PAT')} | ${p.firstName} ${p.lastName} (${p.cnic})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="doctorId" label="Doctor">
            <Select
              allowClear
              showSearch
              loading={metaLoading}
              optionFilterProp="label"
              placeholder="Select doctor (optional)"
              options={doctors.map((d) => ({
                value: d.id,
                label: `${d.firstName} ${d.lastName} (${d.specialization})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={['OPD', 'IPD', 'LAB', 'PHARMACY'].map((x) => ({ label: x, value: x }))} />
          </Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
