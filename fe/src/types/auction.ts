import type { ItemSyncItem } from '.';

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

export type ItemStatus = ItemSyncItem['auctionStatus'];
export type ItemCondition = ItemSyncItem['itemCondition'];

export interface AuctionItem {
  id: number;
  name: string;
  startPrice: number;
  finalPrice?: number;
  status: ItemStatus;
  auctionType: ItemSyncItem['auctionType'];
  condition: ItemCondition;
  thumbnailUrl?: string;
  description?: string;
  bidUnit?: number;
  auctionTime?: number;
  images?: string[];
}
