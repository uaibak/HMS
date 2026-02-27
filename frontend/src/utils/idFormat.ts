const REF_PREFIX: Record<string, string> = {
  PATIENT: 'PAT',
  DOCTOR: 'DOC',
  APPOINTMENT: 'APT',
  ENCOUNTER: 'ENC',
  INVOICE: 'INV',
  LAB_ORDER: 'LBO',
  LAB_TEST: 'LBT',
  PHARMACY_TRANSACTION: 'PTX',
  USER: 'USR',
  MEDICINE: 'MED',
  MANUAL: 'MNL',
};

export function formatShortId(id?: string | null, prefix = 'ID') {
  if (!id) return '-';
  const compact = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `${prefix}-${compact.slice(0, 8)}`;
}

export function formatRefId(referenceType?: string | null, referenceId?: string | null) {
  const prefix = referenceType ? (REF_PREFIX[referenceType] || 'REF') : 'REF';
  return formatShortId(referenceId, prefix);
}
