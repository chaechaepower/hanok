import SellerStats from "./Seller/SellerStats";
import PriceInfo from "./Seller/PriceInfo";
import TopBidderList from "./Seller/TopBidderList";

export default function AuctionPanel() {
    return (
        <div className="flex h-full flex-col gap-4 p-3">
            <SellerStats />
            <PriceInfo />
            <TopBidderList />
        </div>
    );
}
