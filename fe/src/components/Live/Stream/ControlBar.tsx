import SellerControlBar from "./SellerControlBar";
import BuyerControlBar from "./BuyerControlBar";

// 추후 context/props로 판매자 여부 판단
// 지금은 임시로 isSeller = true
export default function ControlBar() {
    const isSeller = true;

    return isSeller ? <SellerControlBar /> : <BuyerControlBar />;
}
