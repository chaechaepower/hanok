package com.ssafy.be.support.util;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.escrow.dto.request.EscrowCancelRequest;
import com.ssafy.be.domain.escrow.dto.request.ShipmentRegisterRequest;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemCondition;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.wallet.entity.WithdrawRequest;
import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import com.ssafy.be.domain.wallet.model.PaymentStatus;
import com.ssafy.be.domain.wallet.model.WalletCharge;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.ssafy.be.domain.item.entity.AuctionType.BOTTOM_UP;
import static com.ssafy.be.domain.item.entity.Category.CLOTHING;
import static com.ssafy.be.domain.seller.entity.SellerType.BUSINESS;
import static com.ssafy.be.domain.seller.entity.SellerType.INDIVIDUAL;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.spy;

public class TestFixture {

    /** 빌더/필드에 {@code id} 없이 단위 테스트에서 {@code getId()}만 고정할 때 (리플렉션 없음). */
    public static Stream spyStreamWithId(Stream stream, long id) {
        Stream s = spy(stream);
        lenient().doReturn(id).when(s).getId();
        return s;
    }

    public static Seller spySellerWithId(Seller seller, long id) {
        Seller s = spy(seller);
        lenient().doReturn(id).when(s).getId();
        return s;
    }

    public static Item spyItemWithId(Item item, long id) {
        Item s = spy(item);
        lenient().doReturn(id).when(s).getId();
        return s;
    }

    public static Auction spyAuctionWithId(Auction auction, long id) {
        Auction s = spy(auction);
        lenient().doReturn(id).when(s).getId();
        return s;
    }

    /** 하향/상향식 테스트용 기본 시작가 */
    public static final long TEST_BOTTOM_UP_START_PRICE = 10000L;
    /** 하향/상향식 테스트용 기본 입찰 단위 */
    public static final long TEST_BOTTOM_UP_BID_UNIT = 1000L;
    /** 경매 타이머 테스트용 기본 지속 시간(초) */
    public static final int TEST_AUCTION_DURATION_SEC = 60;
    /** 에스크로 통합 테스트용 낙찰가(입찰 예치 → 에스크로 이동 금액) */
    public static final long TEST_ESCROW_WINNING_PRICE = TEST_BOTTOM_UP_START_PRICE;

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

    /** 출금 요청 엔티티 — 금액·상태·유저만 지정(영속화는 호출부에서 save). */
    public static WithdrawRequest createWithdrawRequest(long amount, WithdrawStatus status, User user) {
        return WithdrawRequest.builder()
                .amount(amount)
                .withdrawStatus(status)
                .user(user)
                .build();
    }

    /**
     * 단위 테스트 기본 Seller. {@code intro=i}, {@code INDIVIDUAL}, penalty 0.
     * 타입·소개·avgShipDays 등은 {@code .toBuilder()…}로 덮어쓰기.
     */
    public static Seller createSeller(User user) {
        return Seller.builder()
                .intro("i")
                .penaltyCount(0)
                .type(INDIVIDUAL)
                .user(user)
                .build();
    }

    /** DB 저장형 통합 테스트용 사업자 프로필 */
    public static Seller createBusinessSeller(User user) {
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

    public static Item createEscrowAuctionItem(String name, Seller seller) {
        return Item.builder()
                .name(name != null ? name : "에스크로 테스트 상품")
                .description("테스트용 상품 설명")
                .category(CLOTHING)
                .status(ItemStatus.READY)
                .itemCondition(ItemCondition.BRAND_NEW)
                .image1("https://test.example/item.jpg")
                .seller(seller)
                .build();
    }

    public static Item createItemSold(Seller seller) {
        return Item.builder()
                .name("판매완료")
                .description("d")
                .category(CLOTHING)
                .status(ItemStatus.SOLD)
                .itemCondition(ItemCondition.BRAND_NEW)
                .seller(seller)
                .build();
    }

    /** startEscrow 직전 구매자: 입찰 예치만 winning 금액만큼 보유 */
    public static User createBuyerWithBidDepositForEscrow(String name, long winningPrice) {
        return createUser(name).toBuilder()
                .balance(500_000L)
                .depositedBidBalance(winningPrice)
                .depositedEscrowBalance(0L)
                .build();
    }

    /** 저장된 구매자 id 기준 낙찰 Bid (에스크로 시작용) */
    public static Bid createEscrowWinningBid(Long buyerUserId, String buyerNickname, long winningPrice) {
        return Bid.builder()
                .userId(buyerUserId)
                .nickname(buyerNickname)
                .amount(winningPrice)
                .bidAt(LocalDateTime.now())
                .build();
    }

    public static ShipmentRegisterRequest escrowShipmentRegisterRequest() {
        return ShipmentRegisterRequest.builder()
                .carrierName("한진")
                .trackingNumber("503012345678")
                .build();
    }

    public static EscrowCancelRequest escrowManualCancelRequest(long escrowId, String cancelReason) {
        return EscrowCancelRequest.builder()
                .escrowId(escrowId)
                .cancelReason(cancelReason)
                .build();
    }

    /** 통합 테스트용 에스크로 — 상태 DEPOSITED 고정. 다른 상태는 전용 팩토리 추가. */
    public static Escrow createDepositedEscrow(
            long winningPrice,
            long feeAmount,
            Auction auction,
            User buyer,
            Seller seller,
            ShippingAddress shippingAddress) {
        return Escrow.builder()
                .winningPrice(winningPrice)
                .feeAmount(feeAmount)
                .escrowStatus(EscrowStatus.DEPOSITED)
                .auction(auction)
                .buyer(buyer)
                .seller(seller)
                .shippingAddress(shippingAddress)
                .build();
    }

    /** 거래 내역 — escrow 없음(충전·출금 등). */
    public static TradeReport createTradeReport(long amount, TradeType tradeType, User user) {
        return TradeReport.builder()
                .amount(amount)
                .tradeType(tradeType)
                .user(user)
                .build();
    }

    /** 거래 내역 — 정산 등 escrow 연동. */
    public static TradeReport createTradeReport(long amount, TradeType tradeType, User user, Escrow escrow) {
        return TradeReport.builder()
                .amount(amount)
                .tradeType(tradeType)
                .user(user)
                .escrow(escrow)
                .build();
    }

    public static Auction createAuction(AuctionType type, AuctionStatus status, Stream stream, Item item) {
        return Auction.builder()
                .auctionType(type)
                .auctionDuration(TEST_AUCTION_DURATION_SEC)
                .auctionStatus(status)
                .stream(stream)
                .item(item)
                .build();
    }

    /** 상향식 경매 엔티티. {@code stream}·{@code bottomUpDetail}은 null 가능(단위 테스트 스텁 등). */
    public static Auction createBottomUpAuctionEntity(
            Item item, AuctionStatus status, Stream stream, BottomUpAuctionDetail bottomUpDetail) {
        var b = Auction.builder()
                .auctionType(BOTTOM_UP)
                .auctionStatus(status)
                .auctionDuration(TEST_AUCTION_DURATION_SEC)
                .stream(stream)
                .item(item);
        if (bottomUpDetail != null) {
            b.bottomUpAuctionDetail(bottomUpDetail);
        }
        return b.build();
    }

    public static Auction createUniqueTopAuction(AuctionStatus status, Stream stream, Item item) {
        return createAuction(AuctionType.UNIQUE_TOP, status, stream, item);
    }

    public static BottomUpAuctionDetail createBottomUpAuctionDetail(Auction auction) {
        return BottomUpAuctionDetail.builder()
                .auction(auction)
                .startPrice(TEST_BOTTOM_UP_START_PRICE)
                .bidUnit(TEST_BOTTOM_UP_BID_UNIT)
                .build();
    }

    public static BottomUpAuctionDetail createBottomUpAuction(AuctionStatus status, Stream stream, Item item) {
        Auction auction = createAuction(BOTTOM_UP, status, stream, item);
        return createBottomUpAuctionDetail(auction);
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

    public static ShippingAddress createShippingAddressHome(User user) {
        return ShippingAddress.builder()
                .addressName("집")
                .postalCode(12345)
                .address("서울시 강남구")
                .addressDetail("101")
                .phone("010-0000-0001")
                .recipientName("A")
                .isDefault(true)
                .user(user)
                .build();
    }

    public static ShippingAddress createShippingAddressWoori(User user) {
        return ShippingAddress.builder()
                .addressName("우리집")
                .postalCode(12345)
                .address("서울시 강남구 테헤란로 1")
                .addressDetail("101호")
                .phone("010-1234-5678")
                .recipientName("홍길동")
                .isDefault(false)
                .user(user)
                .build();
    }
}
