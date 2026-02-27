import { Button, Card, Descriptions, Form, Input, InputNumber, Modal, Select, Space, Tabs, message } from 'antd';
import { useEffect, useState } from 'react';
import { createLabOrder, createLabTest, getLabOrders, getLabTests, getPatients, updateLabOrder, updateLabTest } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { can } from '../utils/permissions';
import { PageHeader } from '../components/common/PageHeader';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTableWrapper } from '../components/common/DataTableWrapper';

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
  cnic: string;
  phone: string;
  bloodGroup: string;
};

export function LabPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);

  const [orderForm] = Form.useForm();
  const [testForm] = Form.useForm();

  const canCreateLabOrder = can(user?.role, 'lab', 'create');
  const canManageTests = user?.role === 'ADMIN' || user?.role === 'LAB_TECHNICIAN';
  const canCompleteLabOrder = user?.role === 'ADMIN' || user?.role === 'LAB_TECHNICIAN';

  async function load() {
    const [ordersRes, testsRes] = await Promise.all([getLabOrders(1, 50), getLabTests(1, 50)]);
    setOrders(ordersRes.data);
    setTests(testsRes);
  }

  async function searchPatients(search = '') {
    const res = await getPatients({ page: 1, limit: 50, search });
    setPatients(res.data);
  }

  useEffect(() => {
    load();
    searchPatients();
  }, []);

  function openOrderModal() {
    setOrderModalOpen(true);
    setSelectedPatient(null);
    orderForm.resetFields();

    // Auto-fill doctor/staff referral user when creating lab order.
    if (user?.id) {
      orderForm.setFieldsValue({ orderedById: user.id });
    }
  }

  function openCreateTestModal() {
    setEditingTest(null);
    testForm.resetFields();
    setTestModalOpen(true);
  }

  function openEditTestModal(test: any) {
    setEditingTest(test);
    testForm.setFieldsValue(test);
    setTestModalOpen(true);
  }

  async function submitOrder() {
    const values = await orderForm.validateFields();
    await createLabOrder({
      patientId: values.patientId,
      testId: values.testId,
      orderedById: user?.id,
    });
    message.success('Lab order created');
    setOrderModalOpen(false);
    orderForm.resetFields();
    setSelectedPatient(null);
    await load();
  }

  async function submitTest() {
    const values = await testForm.validateFields();
    if (editingTest) {
      await updateLabTest(editingTest.id, values);
      message.success('Lab test updated');
    } else {
      await createLabTest(values);
      message.success('Lab test created');
    }
    setTestModalOpen(false);
    setEditingTest(null);
    testForm.resetFields();
    await load();
  }

  return (
    <div className="page-shell">
      <PageHeader title="Laboratory" subtitle="Manage lab orders, test catalog, and result lifecycle." />
      <SearchFilterBar
        placeholder="Search lab data"
        actions={
          <Space>
            {canCreateLabOrder ? <Button type="primary" onClick={openOrderModal}>Create Lab Order</Button> : null}
            {canManageTests ? <Button onClick={openCreateTestModal}>Add Test Catalog Item</Button> : null}
          </Space>
        }
      />

      <Tabs
        items={[
          {
            key: 'orders',
            label: 'Lab Orders',
            children: (
              <DataTableWrapper rowKey="id" dataSource={orders} columns={[
                { title: 'Patient', render: (_, r) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}` },
                { title: 'Test', render: (_, r) => r.test?.name },
                { title: 'Status', dataIndex: 'sampleStatus' },
                { title: 'Result', dataIndex: 'resultText' },
                {
                  title: 'Actions',
                  render: (_, record) => canCompleteLabOrder && record.sampleStatus !== 'COMPLETED' ? (
                    <Button
                      onClick={async () => {
                        await updateLabOrder(record.id, { sampleStatus: 'COMPLETED' });
                        message.success('Lab order marked completed');
                        await load();
                      }}
                    >
                      Mark Completed
                    </Button>
                  ) : 'View Only',
                },
              ]} />
            ),
          },
          {
            key: 'tests',
            label: 'Test Catalog',
            children: (
              <DataTableWrapper rowKey="id" dataSource={tests} columns={[
                { title: 'Name', dataIndex: 'name' },
                { title: 'Description', dataIndex: 'description' },
                { title: 'Price', dataIndex: 'price' },
                {
                  title: 'Actions',
                  render: (_, record) => canManageTests ? (
                    <Button onClick={() => openEditTestModal(record)}>Edit</Button>
                  ) : 'View Only',
                },
              ]} />
            ),
          },
        ]}
      />

      <Modal open={orderModalOpen && canCreateLabOrder} title="Create Lab Order" onCancel={() => setOrderModalOpen(false)} onOk={submitOrder}>
        <Form form={orderForm} layout="vertical">
          <Form.Item name="patientId" label="Patient" rules={[{ required: true, message: 'Please select a patient' }]}>
            <Select
              showSearch
              filterOption={false}
              placeholder="Search by patient name or CNIC"
              onSearch={(value) => searchPatients(value)}
              onChange={(id: string) => {
                // Auto-fill patient summary for referral workflows.
                const patient = patients.find((x) => x.id === id) || null;
                setSelectedPatient(patient);
              }}
              options={patients.map((p) => ({ label: `${p.firstName} ${p.lastName} (${p.cnic})`, value: p.id }))}
            />
          </Form.Item>

          {selectedPatient ? (
            <Card size="small" style={{ marginBottom: 12 }}>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Patient ID">{selectedPatient.id}</Descriptions.Item>
                <Descriptions.Item label="Name">{selectedPatient.firstName} {selectedPatient.lastName}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedPatient.phone}</Descriptions.Item>
                <Descriptions.Item label="Blood Group">{selectedPatient.bloodGroup}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : null}

          <Form.Item name="testId" label="Test" rules={[{ required: true, message: 'Please select a test' }]}>
            <Select showSearch optionFilterProp="label" options={tests.map((t) => ({ label: `${t.name} (PKR ${t.price})`, value: t.id }))} />
          </Form.Item>

          <Form.Item name="orderedById" label="Ordered By">
            <Input disabled value={`${user?.firstName || ''} ${user?.lastName || ''} (${user?.id || ''})`} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={testModalOpen && canManageTests} title={editingTest ? 'Edit Test Catalog Item' : 'Add Test Catalog Item'} onCancel={() => setTestModalOpen(false)} onOk={submitTest}>
        <Form form={testForm} layout="vertical">
          <Form.Item name="name" label="Test Name" rules={[{ required: true, message: 'Test name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Price is required' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
