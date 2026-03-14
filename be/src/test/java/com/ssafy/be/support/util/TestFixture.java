package com.ssafy.be.support.util;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;

import java.util.UUID;

import static com.ssafy.be.domain.item.entity.Category.CLOTHING;
import static com.ssafy.be.domain.seller.entity.SellerType.BUSINESS;

public class TestFixture {
    public static User createTestUser(String name) {
        return User.createUser(
                "test" + UUID.randomUUID() + "@test.com",
                "password",
                name != null ? name : "테스트 유저",
                "010-1234-5678"
        );
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
                .name(name!=null ? name: "테스트 상품")
                .category(CLOTHING)
                .startPrice(10000L)
                .bidUnit(1000L)
                .auctionDuration(60)
                .build();
    }

    public static Auction createAuction(AuctionStatus status, Stream stream, Item item) {
        return Auction.builder()
                .auctionStatus(status)
                .stream(stream)
                .item(item)
                .build();
    }
}
