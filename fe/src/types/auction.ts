export interface ShippingAddressResponse {
  recipientName: string;
  addressName: string;
  postalCode: number;
  phone: string;
  address: string;
  addressDetail: string;
}

export interface WinModalProps {
  isOpen: boolean;
  itemName: string;
  itemCond: string;
  finalPrice: number;
  address: ShippingAddressResponse;
  onConfirm: () => Promise<void>;
  onClose?: () => void;
}
