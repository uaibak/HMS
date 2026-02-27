import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function getDashboardSummary() {
  const { data } = await api.get('/reports/dashboard');
  return data;
}

export async function getUsers(page = 1, limit = 10) {
  const { data } = await api.get('/users', { params: { page, limit } });
  return data;
}

export async function createUser(payload: Record<string, unknown>) {
  const { data } = await api.post('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export async function getPatients(params: { page: number; limit: number; search?: string }) {
  const { data } = await api.get('/patients', { params });
  return data;
}

export async function createPatient(payload: Record<string, unknown>) {
  const { data } = await api.post('/patients', payload);
  return data;
}

export async function updatePatient(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/patients/${id}`, payload);
  return data;
}

export async function deletePatient(id: string) {
  const { data } = await api.delete(`/patients/${id}`);
  return data;
}

export async function getDoctors(page = 1, limit = 10) {
  const { data } = await api.get('/doctors', { params: { page, limit } });
  return data;
}

export async function createDoctor(payload: Record<string, unknown>) {
  const { data } = await api.post('/doctors', payload);
  return data;
}

export async function updateDoctor(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/doctors/${id}`, payload);
  return data;
}

export async function deleteDoctor(id: string) {
  const { data } = await api.delete(`/doctors/${id}`);
  return data;
}

export async function getAppointments(page = 1, limit = 10) {
  const { data } = await api.get('/appointments', { params: { page, limit } });
  return data;
}

export async function createAppointment(payload: Record<string, unknown>) {
  const { data } = await api.post('/appointments', payload);
  return data;
}

export async function updateAppointment(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/appointments/${id}`, payload);
  return data;
}

export async function cancelAppointment(id: string) {
  const { data } = await api.patch(`/appointments/${id}/cancel`);
  return data;
}

export async function getMedicines(page = 1, limit = 10) {
  const { data } = await api.get('/pharmacy/medicines', { params: { page, limit } });
  return data;
}

export async function createMedicine(payload: Record<string, unknown>) {
  const { data } = await api.post('/pharmacy/medicines', payload);
  return data;
}

export async function prescribeMedicine(payload: Record<string, unknown>) {
  const { data } = await api.post('/pharmacy/prescriptions', payload);
  return data;
}

export async function getPharmacyTransactions(page = 1, limit = 20) {
  const { data } = await api.get('/pharmacy/transactions', { params: { page, limit } });
  return data;
}

export async function getLabOrders(page = 1, limit = 10) {
  const { data } = await api.get('/lab/orders', { params: { page, limit } });
  return data;
}

export async function createLabOrder(payload: Record<string, unknown>) {
  const { data } = await api.post('/lab/orders', payload);
  return data;
}

export async function updateLabOrder(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/lab/orders/${id}`, payload);
  return data;
}

export async function getLabTests(page = 1, limit = 10) {
  const { data } = await api.get('/lab/tests', { params: { page, limit } });
  return data;
}

export async function createLabTest(payload: Record<string, unknown>) {
  const { data } = await api.post('/lab/tests', payload);
  return data;
}

export async function updateLabTest(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/lab/tests/${id}`, payload);
  return data;
}

export async function getInvoices(page = 1, limit = 10) {
  const { data } = await api.get('/billing/invoices', { params: { page, limit } });
  return data;
}

export async function createInvoice(payload: Record<string, unknown>) {
  const { data } = await api.post('/billing/invoices', payload);
  return data;
}

export async function recordInvoicePayment(id: string, paidAmount: number) {
  const { data } = await api.patch(`/billing/invoices/${id}/payment`, { paidAmount });
  return data;
}

export async function getSettings() {
  const { data } = await api.get('/settings');
  return data;
}

export async function saveSettings(payload: Record<string, unknown>) {
  const { data } = await api.put('/settings', payload);
  return data;
}
