import { Alert, App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  createMedicine,
  getMedicines,
  getPatients,
  getPharmacyTransactions,
  prescribeMedicine,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';
import { formatLocalDateTime } from '../utils/dateTime';
import { formatShortId } from '../utils/idFormat';
import { PageHeader } from '../components/common/PageHeader';
import { DataTableWrapper } from '../components/common/DataTableWrapper';

type MedicineRow = {
  id: string;
  name: string;
  batchNo: string;
  stock: number;
  unitPrice: number;
  expiryDate: string;
};

export function PharmacyPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  const [inventoryForm] = Form.useForm();
  const [prescriptionForm] = Form.useForm();

  const canManageInventory = can(user?.role, 'pharmacy', 'create');
  const canPrescribe = user?.role === 'DOCTOR' || user?.role === 'ADMIN';
  const lowStock = medicines.filter((m) => m.stock < 20);

  async function load() {
    try {
      setInventoryLoading(true);
      setTransactionsLoading(true);
      const [medsRes, txRes, patientsRes] = await Promise.all([
        getMedicines(1, 100),
        getPharmacyTransactions(1, 100),
        getPatients({ page: 1, limit: 100 }),
      ]);

      setMedicines(medsRes.data);
      setTransactions(txRes);
      setPatients(patientsRes.data);
    } catch {
      message.error('Unable to load pharmacy data');
    } finally {
      setInventoryLoading(false);
      setTransactionsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitInventory() {
    try {
      setSavingInventory(true);
      const values = await inventoryForm.validateFields();
      await createMedicine({
        ...values,
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
      });
      await load();
      message.success('Medicine added to inventory');
      setInventoryModalOpen(false);
      inventoryForm.resetFields();
    } catch {
      message.error('Unable to add medicine');
    } finally {
      setSavingInventory(false);
    }
  }

  async function submitPrescription() {
    try {
      setSavingPrescription(true);
      const values = await prescriptionForm.validateFields();
      const medicine = medicines.find((m) => m.id === values.medicineId);

      if (!medicine) {
        message.error('Selected medicine was not found');
        return;
      }

      if (medicine.stock < values.quantity) {
        message.error('Insufficient stock for selected quantity');
        return;
      }

      await prescribeMedicine(values);
      await load();
      // Backend auto-creates PHARMACY invoice and sale transaction for patient.
      message.success('Medicine suggested successfully. Invoice entry added for patient billing.');
      setPrescriptionModalOpen(false);
      prescriptionForm.resetFields();
    } catch {
      message.error('Unable to suggest medicine');
    } finally {
      setSavingPrescription(false);
    }
  }

  const selectedMedicineId = Form.useWatch('medicineId', prescriptionForm);
  const selectedQuantity = Form.useWatch('quantity', prescriptionForm) || 0;
  const selectedMedicine = medicines.find((m) => m.id === selectedMedicineId);

  const estimatedTotal = useMemo(() => {
    if (!selectedMedicine) return 0;
    return Number((selectedMedicine.unitPrice * selectedQuantity).toFixed(2));
  }, [selectedMedicine, selectedQuantity]);

  return (
    <div className="page-shell">
      <PageHeader title="Pharmacy" subtitle="Inventory, prescriptions, and dispensing transactions." />

      <Space style={{ marginBottom: 12 }}>
        {canManageInventory ? (
          <Button type="primary" onClick={() => setInventoryModalOpen(true)}>
            Add Medicine
          </Button>
        ) : null}

        {canPrescribe ? (
          <Button onClick={() => setPrescriptionModalOpen(true)}>
            Suggest Medicine To Patient
          </Button>
        ) : null}
      </Space>

      {lowStock.length ? (
        <Alert
          type="warning"
          style={{ marginBottom: 12 }}
          message={`Low stock alert: ${lowStock.length} medicine(s) below threshold.`}
        />
      ) : null}

      <Tabs
        items={[
          {
            key: 'inventory',
            label: 'Inventory',
            children: (
              <DataTableWrapper
                rowKey="id"
                loading={inventoryLoading}
                dataSource={medicines}
                columns={[
                  { title: 'Name', dataIndex: 'name' },
                  { title: 'Batch', dataIndex: 'batchNo' },
                  { title: 'Expiry', render: (_, r) => formatLocalDateTime(r.expiryDate) },
                  { title: 'Stock', dataIndex: 'stock' },
                  { title: 'Unit Price', dataIndex: 'unitPrice' },
                ]}
              />
            ),
          },
          {
            key: 'transactions',
            label: 'Transactions',
            children: (
              <DataTableWrapper
                rowKey="id"
                loading={transactionsLoading}
                dataSource={transactions}
                columns={[
                  { title: 'Medicine', render: (_, r) => r.medicine?.name },
                  { title: 'Patient', render: (_, r) => (r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-') },
                  { title: 'Type', dataIndex: 'type' },
                  { title: 'Qty', dataIndex: 'quantity' },
                  { title: 'Amount', dataIndex: 'amount' },
                  { title: 'Date', render: (_, r) => formatLocalDateTime(r.transactionDate) },
                ]}
              />
            ),
          },
        ]}
      />

      <Modal
        open={inventoryModalOpen && canManageInventory}
        title="Add Medicine"
        onCancel={() => setInventoryModalOpen(false)}
        onOk={submitInventory}
        okButtonProps={{ loading: savingInventory }}
      >
        <Form form={inventoryForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="genericName" label="Generic Name"><Input /></Form.Item>
          <Form.Item name="batchNo" label="Batch No" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="expiryDate" label="Expiry Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="unitPrice" label="Unit Price" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        open={prescriptionModalOpen && canPrescribe}
        title="Suggest Medicine To Patient"
        onCancel={() => setPrescriptionModalOpen(false)}
        onOk={submitPrescription}
        okButtonProps={{ loading: savingPrescription }}
      >
        <Form form={prescriptionForm} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Please select patient' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search patient by name/CNIC"
              options={patients.map((p) => ({
                value: p.id,
                label: `${formatShortId(p.id, 'PAT')} | ${p.firstName} ${p.lastName} (${p.cnic})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="medicineId" label="Medicine" rules={[{ required: true, message: 'Please select medicine' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search medicine"
              options={medicines.map((m) => ({
                value: m.id,
                label: `${m.name} | Stock: ${m.stock} | PKR ${m.unitPrice}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Please enter quantity' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Usage instructions, duration, etc." />
          </Form.Item>

          <Alert type="info" showIcon message={`Estimated total: PKR ${estimatedTotal}`} />
        </Form>
      </Modal>
    </div>
  );
}
