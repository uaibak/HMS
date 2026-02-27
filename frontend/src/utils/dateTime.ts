import dayjs from 'dayjs';

export const LOCAL_DATE_TIME_FORMAT = 'DD MMM YYYY, hh:mm A';

export function formatLocalDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(LOCAL_DATE_TIME_FORMAT) : '-';
}
