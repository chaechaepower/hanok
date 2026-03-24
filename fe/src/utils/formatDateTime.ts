type DateInput = string | Date | null | undefined;

const pad = (value: number) => String(value).padStart(2, '0');

const toValidDate = (value: DateInput) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value: DateInput, fallback = '') => {
  const date = toValidDate(value);
  if (!date) {
    return typeof value === 'string' ? value : fallback;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatScheduledDateTime = (value: DateInput, fallback = '') => {
  const date = toValidDate(value);
  if (!date) {
    return typeof value === 'string' ? value : fallback;
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
