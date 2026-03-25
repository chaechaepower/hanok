import type { AddressFormState } from '@/types';

export const EMPTY_FORM: AddressFormState = {
  addressName: '',
  recipientName: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  phone: '010',
};

export const ADDRESS_SEARCH_COUNT_PER_PAGE = 10;
