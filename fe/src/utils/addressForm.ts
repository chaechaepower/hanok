export const isValidPhoneNumber = (phone: string) => /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone);

export const formatPhoneNumber = (value: string) => {
  const raw = value.replace(/^010-?/, '').replace(/[^0-9]/g, '');

  if (raw.length <= 4) {
    return raw.length > 0 ? `010-${raw}` : '010';
  }

  return `010-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
};
