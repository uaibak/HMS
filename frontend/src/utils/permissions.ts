export type AppRole = 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'RECEPTIONIST';
export type AppModule =
  | 'users'
  | 'patients'
  | 'doctors'
  | 'appointments'
  | 'pharmacy'
  | 'lab'
  | 'billing'
  | 'reports'
  | 'settings';
export type AppAction = 'view' | 'create' | 'update' | 'delete' | 'cancel' | 'reschedule' | 'pay';

const PERMISSIONS: Record<AppRole, Partial<Record<AppModule, AppAction[]>>> = {
  ADMIN: {
    users: ['view', 'create', 'update', 'delete'],
    patients: ['view', 'create', 'update', 'delete'],
    doctors: ['view', 'create', 'update', 'delete'],
    appointments: ['view', 'create', 'update', 'delete', 'cancel', 'reschedule'],
    pharmacy: ['view', 'create', 'update', 'delete'],
    lab: ['view', 'create', 'update', 'delete'],
    billing: ['view', 'create', 'update', 'pay'],
    reports: ['view'],
    settings: ['view', 'update'],
  },
  DOCTOR: {
    patients: ['view'],
    doctors: ['view'],
    appointments: ['view', 'reschedule'],
    pharmacy: ['view'],
    lab: ['view', 'create'],
    billing: ['view'],
    reports: ['view'],
  },
  PHARMACIST: {
    pharmacy: ['view', 'create', 'update'],
    reports: ['view'],
  },
  LAB_TECHNICIAN: {
    lab: ['view', 'create', 'update'],
    reports: ['view'],
  },
  RECEPTIONIST: {
    patients: ['view', 'create'],
    doctors: ['view'],
    appointments: ['view', 'create', 'update', 'cancel'],
    lab: ['create'],
    billing: ['view', 'create', 'update', 'pay'],
    reports: ['view'],
  },
};

export function can(role: string | undefined, module: AppModule, action: AppAction): boolean {
  if (!role) return false;
  const rolePermissions = PERMISSIONS[role as AppRole];
  return !!rolePermissions?.[module]?.includes(action);
}
