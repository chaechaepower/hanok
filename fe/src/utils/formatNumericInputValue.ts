export function formatNumericInputValue(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const digitsOnly = String(value).replace(/[^0-9]/g, '');

  if (!digitsOnly) {
    return '';
  }

  return Number(digitsOnly).toLocaleString('ko-KR');
}
