import SellerControlBar from "./SellerControlBar";
import BuyerControlBar from "./BuyerControlBar";

interface Props {
    isSeller: boolean;
}

export default function ControlBar({ isSeller }: Props) {
    return isSeller ? <SellerControlBar /> : <BuyerControlBar />;
}
