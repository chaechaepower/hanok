const pad = (value: number) => String(value).padStart(2, '0');

const toValidDate = (value: string | Date) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatStreamScheduledAt = (value: string | Date) => {
  const date = toValidDate(value);
  if (!date) {
    return typeof value === 'string' ? value : '';
  }

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join('T');
};

export const normalizeStreamScheduledAt = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return formatStreamScheduledAt(value);
};
