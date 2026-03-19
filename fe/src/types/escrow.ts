export type EscrowState = 'DEPOSITED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export type EscrowItem = {
  escrowId?: string | number;
  image?: string;
  itemName: string;
  amount: number;
  escrowStatus: EscrowState;
  createdAt: string;
};

export type EscrowDetailResponse = {
  winningInfo: {
    image: string;
    itemName: string;
    finalPrice: number;
    sellerName: string;
    sellerId: string;
    wonAt: string;
  };
  shippingAddress: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
  };
  delivery: {
    courierName: string;
    trackingNumber: string;
  } | null;
};

export type PostTrackingInfoPayload = {
  carrierName: string;
  trackingNumber: string;
};

export type SoldAuctionItem = {
  image: string;
  itemName: string;
  amount: number;
  escrowStatus: EscrowState;
  createdAt: string;
};
