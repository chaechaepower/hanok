export interface BiznoResponse {
  resultCode: number;
  resultMsg: string;
  totalCount: number;
  items: Array<{
    bno: string;
    company: string;
    bstt: string;
    taxtype: string;
  } | null>;
}
