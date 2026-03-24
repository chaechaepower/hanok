package com.ssafy.be.support.util;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.ssafy.be.domain.item.entity.AuctionType.BOTTOM_UP;
import static com.ssafy.be.domain.item.entity.Category.CLOTHING;
import static com.ssafy.be.domain.seller.entity.SellerType.BUSINESS;

public class TestFixture {

    /** 하향/상향식 테스트용 기본 시작가 */
    public static final long TEST_BOTTOM_UP_START_PRICE = 10000L;
    /** 하향/상향식 테스트용 기본 입찰 단위 */
    public static final long TEST_BOTTOM_UP_BID_UNIT = 1000L;
    /** 경매 타이머 테스트용 기본 지속 시간(초) */
    public static final int TEST_AUCTION_DURATION_SEC = 60;

    public static User createUser(String name) {
        return User.createUser(
                "test" + UUID.randomUUID() + "@test.com",
                "password",
                name != null ? name : "테스트 유저",
                "010-1234-5678"
        );
    }

    public static List<User> createUsers(int count) {
        List<User> users = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            users.add(createUser("입찰자" + i));
        }
        return users;
    }

    public static WalletCharge createWalletCharge(Long userId, PaymentStatus status) {
        return WalletCharge.builder()
                .userId(userId)
                .amount(10000L)
                .status(status)
                .build();
    }

    public static Seller createSeller(User user) {
        return Seller.builder()
                .intro("테스트 판매자입니다.")
                .penaltyCount(0)
                .type(BUSINESS)
                .user(user)
                .build();
    }

    public static Stream createStream(String title, Seller seller) {
        return Stream.builder()
                .title(title != null ? title : "테스트 라이브 방송")
                .seller(seller)
                .build();
    }

    public static Item createItem(String name) {
        return Item.builder()
                .name(name != null ? name : "테스트 상품")
                .category(CLOTHING)
                .build();
    }

    public static Auction createAuction(AuctionStatus status, Stream stream, Item item) {
        return Auction.builder()
                .auctionType(BOTTOM_UP)
                .auctionDuration(TEST_AUCTION_DURATION_SEC)
                .auctionStatus(status)
                .stream(stream)
                .item(item)
                .build();
    }

    public static BottomUpAuctionDetail createBottomUpAuctionDetail(Auction auction) {
        return BottomUpAuctionDetail.builder()
                .auction(auction)
                .startPrice(TEST_BOTTOM_UP_START_PRICE)
                .bidUnit(TEST_BOTTOM_UP_BID_UNIT)
                .build();
    }

    public static ShippingAddress createShippingAddress(User user) {
        return ShippingAddress.builder()
                .user(user)
                .addressName("기본 배송지")
                .postalCode(12345)
                .address("서울시 테스트구 테스트로 123")
                .addressDetail("101동 202호")
                .phone("010-1111-2222")
                .recipientName("테스트 수령인")
                .isDefault(true)
                .build();
    }
}
