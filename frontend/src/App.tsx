import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { PatientsPage } from './pages/PatientsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PharmacyPage } from './pages/PharmacyPage';
import { LabPage } from './pages/LabPage';
import { BillingPage } from './pages/BillingPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<ProtectedRoute permission={{ module: 'users', action: 'view' }}><UsersPage /></ProtectedRoute>} />
        <Route path="patients" element={<ProtectedRoute permission={{ module: 'patients', action: 'view' }}><PatientsPage /></ProtectedRoute>} />
        <Route path="doctors" element={<ProtectedRoute permission={{ module: 'doctors', action: 'view' }}><DoctorsPage /></ProtectedRoute>} />
        <Route path="appointments" element={<ProtectedRoute permission={{ module: 'appointments', action: 'view' }}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="pharmacy" element={<ProtectedRoute permission={{ module: 'pharmacy', action: 'view' }}><PharmacyPage /></ProtectedRoute>} />
        <Route path="lab" element={<ProtectedRoute roles={["ADMIN", "LAB_TECHNICIAN", "DOCTOR", "RECEPTIONIST"]}><LabPage /></ProtectedRoute>} />
        <Route path="billing" element={<ProtectedRoute permission={{ module: 'billing', action: 'view' }}><BillingPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute permission={{ module: 'reports', action: 'view' }}><ReportsPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute permission={{ module: 'settings', action: 'view' }}><SettingsPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
