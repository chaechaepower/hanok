export type TrackingDetail = {
  code: string;
  kind: string;
  level: number;
  manName: string;
  manPic: string;
  remark: string;
  telno: string;
  telno2: string;
  time: number;
  timeString: string;
  where: string;
};

export type TrackingResult = {
  adUrl: string;
  complete: boolean;
  completeYN: string;
  estimate: string;
  firstDetail: TrackingDetail;
  invoiceNo: string;
  itemImage: string;
  itemName: string;
  lastDetail: TrackingDetail;
  lastStateDetail: TrackingDetail;
  level: number;
  orderNumber: string;
  productInfo: string;
  receiverAddr: string;
  receiverName: string;
  recipient: string;
  result: string;
  senderName: string;
  trackingDetails: TrackingDetail[];
  zipCode: string;
};

export type TrackingErrorResponse = {
  code: string;
  msg: string;
  status: boolean;
};
