type FormatPriceOptions = {
  suffix?: string | false;
};

export function formatPrice(value?: number | null, options: FormatPriceOptions = {}) {
  const normalizedValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const formattedValue = normalizedValue.toLocaleString('ko-KR');

  if (options.suffix === false) {
    return formattedValue;
  }

  return `${formattedValue}${options.suffix ?? '원'}`;
}
