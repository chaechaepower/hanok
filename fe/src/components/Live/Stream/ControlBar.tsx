import SellerControlBar from "./SellerControlBar";
import BuyerControlBar from "./BuyerControlBar";
import type { BidSyncPayload } from "@/types";

interface Props {
    isSeller: boolean;
    bidSync: BidSyncPayload | null;
}

export default function ControlBar({ isSeller, bidSync }: Props) {
    return isSeller ? <SellerControlBar /> : <BuyerControlBar bidSync={bidSync} />;
}
