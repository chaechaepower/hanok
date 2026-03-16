export type EscrowState = 'DEPOSITED' | 'INVOICE_SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export type EscrowItem = {
  escrowId?: string | number;
  imageUrl?: string;
  itemName: string;
  amount: number;
  escrowState: EscrowState;
  createdAt: string;
};

export type EscrowListResponse = {
  status: string;
  message: string;
  data: EscrowItem[];
};

export type EscrowDetailResponse = {
  status: string;
  message: string;
  data: {
    winningInfo: {
      imageUrl?: string;
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
};

export type PostTrackingInfoPayload = {
  carrierName: string;
  trackingNumber: string;
};

export type SoldAuctionItem = {
  escrowId: number;
  image: string;
  itemName: string;
  amount: number;
  escrowStatus: EscrowState;
  createdAt: string;
};
