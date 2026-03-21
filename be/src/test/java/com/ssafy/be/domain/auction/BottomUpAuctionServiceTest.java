package com.ssafy.be.domain.auction;

import com.ssafy.be.domain.bottomupauction.dto.request.AuctionStartRequest;
import com.ssafy.be.domain.bottomupauction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.request.ItemIntroduceRequest;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.dto.response.AuctionStartResponse;
import com.ssafy.be.domain.bottomupauction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.auction.dto.response.BidWinnerResponse;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.bottomupauction.exception.AuctionErrorCode;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.bottomupauction.repository.AuctionBidRepository;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.domain.escrow.service.EscrowService;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.exception.StompException;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@IntegrationTest
class BottomUpAuctionServiceTest {
    @Autowired
    private AuctionService auctionService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SellerRepository sellerRepository;
    @Autowired
    private StreamRepository streamRepository;
    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private AuctionRepository auctionRepository;
    @Autowired
    private AuctionBidRepository auctionBidRepository;
    @Autowired
    private AuctionTimerRepository auctionTimerRepository;
    @Autowired
    private BottomUpAuctionDetailRepository bottomUpAuctionDetailRepository;
    @Autowired
    ShippingAddressRepository shippingAddressRepository;
    @Autowired
    private StringRedisTemplate redisTemplate;
    @MockitoBean
    private EscrowService escrowService;

    private User sellerUser;
    private Seller seller;
    private Stream stream;
    private Item item;

    @BeforeEach
    void setUp() {
        sellerUser = userRepository.save(
                TestFixture.createUser("판매자")
        );

        seller = sellerRepository.save(
                TestFixture.createSeller(sellerUser)
        );

        stream = streamRepository.save(
                TestFixture.createStream("테스트 라이브 방송", seller)
        );

        item = itemRepository.save(
                TestFixture.createItem("테스트 상품")
        );
    }

    @AfterEach
    void cleanup() {
        auctionRepository.findAll().forEach(auction -> {
            Long auctionId = auction.getId();
            redisTemplate.delete(AuctionRedisKeys.getTimerKey(auctionId));
            redisTemplate.delete(AuctionRedisKeys.getBidKey(auctionId));
            redisTemplate.delete(AuctionRedisKeys.getLockKey(auctionId));
        });

        shippingAddressRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    private Auction saveBottomUpAuction(AuctionStatus status) {
        Auction auction = auctionRepository.save(
                TestFixture.createAuction(status, stream, item)
        );

        BottomUpAuctionDetail detail = TestFixture.createBottomUpAuctionDetail(auction, item);
        bottomUpAuctionDetailRepository.save(detail);

        return auction;
    }

    // ======================== 경매 물품 설명 ========================

    @DisplayName("라이브 스트림 호스트는 스트림에 등록된 경매 물품을 소개할 수 있다.")
    @Test
    void introduceItem() {
        //given
        Auction readyAuction = saveBottomUpAuction(READY);

        ItemIntroduceRequest request = ItemIntroduceRequest.builder()
                .auctionId(readyAuction.getId())
                .build();

        //when
        auctionService.introduceItem(request, stream.getId(), sellerUser.getId());

        //then
        Auction introducedAuction = auctionRepository.findById(readyAuction.getId()).orElseThrow();

        // 1. 소개중 상태인지 확인
        assertThat(introducedAuction.getAuctionStatus()).isEqualTo(INTRODUCING);
    }


    // ======================== 경매 시작 ========================

    @DisplayName("경매를 시작한다.")
    @Test
    void startAuction() {
        // given
        Auction introductingAuction = saveBottomUpAuction(INTRODUCING);

        AuctionStartRequest request = AuctionStartRequest.builder()
                .auctionId(introductingAuction.getId())
                .build();

        // when
        List<StreamPublishTask> streamPublishTasks = auctionService.startAuction(request, stream.getId(), sellerUser.getId());

        // then
        // 1. auction 엔티티의 상태가 경매중 상태로 변경됐는지 확인
        Auction savedAuction = auctionRepository.findById(introductingAuction.getId()).orElseThrow();

        assertThat(savedAuction.getAuctionStatus()).isEqualTo(LIVE);
        assertThat(savedAuction.getStartedAt()).isNotNull();

        // 2. 레디스에 타이머 세팅됐는지 확인
        assertThat(auctionTimerRepository.existsByAuctionId(introductingAuction.getId())).isTrue();

        // 3. 요청한 경매 물품으로 세팅됐는지 확인
        AuctionStartResponse response = streamPublishTasks.stream()
                .map(StreamPublishTask::getPayload)
                .filter(AuctionStartResponse.class::isInstance)
                .map(AuctionStartResponse.class::cast)
                .findFirst()
                .orElseThrow();

        AuctionStartResponse.AuctionStartItemDto itemDto = response.item();
        assertThat(itemDto.name()).isEqualTo("테스트 상품");
        assertThat(itemDto.startPrice()).isEqualTo(10000L);
        assertThat(itemDto.bidUnit()).isEqualTo(1000L);

        AuctionStartResponse.AuctionStartTimerDto timerDto = response.timer();
        assertThat(timerDto.durationSeconds()).isEqualTo(60);
        assertThat(timerDto.serverNow()).isNotNull();
        assertThat(timerDto.serverNow()).isEqualTo(timerDto.serverStartedAt()); // 경매 시작할 때 동일함
    }

    // ======================== 경매 입찰 ========================

    @DisplayName("경매중인 상품에 대해 입찰을 한다.")
    @Test
    void placeBid() {
        // given
        // 1. 실시간 경매중인 auction 엔티티 생성
        Auction liveAuction = saveBottomUpAuction(LIVE);

        // 2. 입찰자 생성
        User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder()
                .balance(50000L)
                .depositedBidBalance(0L)
                .build());

        // 3. 경매 타이머 설정
        auctionTimerRepository.save(liveAuction.getId(), liveAuction.getAuctionDuration());

        // 4. request dto 생성
        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;

        BidPlaceRequest request = BidPlaceRequest.builder()
                .auctionId(liveAuction.getId())
                .amount(bidAmount)
                .build();

        // when
        List<StreamPublishTask> tasks = auctionService.placeBid(request, stream.getId(), bidder.getId());

        // then
        assertThat(tasks).isNotEmpty();

        // 1. 입찰 정보 검증
        BidPlaceResponse response = tasks.stream()
                .map(StreamPublishTask::getPayload)
                .filter(BidPlaceResponse.class::isInstance)
                .map(BidPlaceResponse.class::cast)
                .findFirst()
                .orElseThrow();

        BidPlaceResponse.BidInfoDto bidInfo = response.bidInfo();

        assertThat(bidInfo).isNotNull();
        assertThat(bidInfo.nickname()).isEqualTo(bidder.getNickname());
        assertThat(bidInfo.amount()).isEqualTo(bidAmount);
        assertThat(bidInfo.placedAt()).isNotNull();

        // 2. 스나이핑 구간이 아닌 상황(충분히 여유 있는 시간)이라면 snipingTimer는 null이어야 함
        assertThat(response.snipingTimer()).isNull();
    }

    @DisplayName("입찰 금액은 시작가보다 높아야한다.")
    @Test
    void placeBidWithAmountBelowStartPrice() {
        // given
        Auction liveAuction = saveBottomUpAuction(LIVE);

        User bidder = userRepository.save(
                TestFixture.createUser("입찰자").toBuilder()
                        .balance(50_000L)
                        .depositedBidBalance(0L)
                        .build()
        );

        // 시작가보다 1원 낮게
        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE - 1;

        BidPlaceRequest request = BidPlaceRequest.builder()
                .auctionId(liveAuction.getId())
                .amount(bidAmount)
                .build();

        // when // then
        assertThatThrownBy(() -> auctionService.placeBid(request, stream.getId(), bidder.getId()))
                .isInstanceOf(StompException.class)
                .extracting("errorType")
                .isEqualTo(AuctionErrorCode.AUCTION_BID_BELOW_START_PRICE);
    }

    @DisplayName("사용자 잔액이 부족하면 입찰에 실패한다.")
    @Test
    void placeBidWithInsufficientBalance() {
        // given
        Auction liveAuction = saveBottomUpAuction(LIVE);

        User bidder = userRepository.save(
                TestFixture.createUser("입찰자").toBuilder()
                        .balance(100L)  // 잔액 부족 유발
                        .depositedBidBalance(0L)
                        .build()
        );

        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;

        BidPlaceRequest request = BidPlaceRequest.builder()
                .auctionId(liveAuction.getId())
                .amount(bidAmount)
                .build();

        // when & then
        assertThatThrownBy(() -> auctionService.placeBid(request, stream.getId(), bidder.getId()))
                .isInstanceOf(StompException.class)
                .extracting("errorType")
                .isEqualTo(AuctionErrorCode.AUCTION_BID_INSUFFICIENT_BALANCE);
    }

    @DisplayName("남은 시간이 스나이핑 구간이면 타이머가 연장되고 snipingTimer가 응답에 포함된다.")
    @Test
    void placeBidWhenSnipingExtendsTimer() {
        // given
        Auction liveAuction = saveBottomUpAuction(LIVE);

        User bidder = userRepository.save(
                TestFixture.createUser("입찰자").toBuilder()
                        .balance(50000L)
                        .depositedBidBalance(0L)
                        .build()
        );

        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;

        BidPlaceRequest request = BidPlaceRequest.builder()
                .auctionId(liveAuction.getId())
                .amount(bidAmount)
                .build();

        // 스나이핑 구간(5초 이하)에 들어오도록, 남은 시간이 3초가 되게 타이머 설정
        auctionTimerRepository.save(liveAuction.getId(), 3);

        // when
        List<StreamPublishTask> tasks = auctionService.placeBid(request, stream.getId(), bidder.getId());

        // then
        BidPlaceResponse response = tasks.stream()
                .map(StreamPublishTask::getPayload)
                .filter(BidPlaceResponse.class::isInstance)
                .map(BidPlaceResponse.class::cast)
                .findFirst()
                .orElseThrow();

        // 스나이핑 구간이므로 snipingTimer가 있어야 함
        assertThat(response.snipingTimer()).isNotNull();
        assertThat(response.snipingTimer().durationSeconds()).isEqualTo(5); // SNIPING_THRESHOLD_SECONDS
    }

    // ======================== 경매 종료 ========================

    @DisplayName("입찰이 없으면 경매는 유찰 처리된다.")
    @Test
    void endUnsoldAuction() {
        // given
        Auction liveAuction = saveBottomUpAuction(LIVE);

        // Redis에는 타이머가 만료되었다고 가정하고, bids 도 넣지 않음 (findTopBid → empty)

        // when
        List<StreamPublishTask> tasks = auctionService.endAuction(liveAuction.getId());

        // then
        // 1. 엔티티 상태가 UNSOLD 로 변경되었는지
        Auction endedAuction = auctionRepository.findById(liveAuction.getId()).orElseThrow();

        assertThat(endedAuction.getAuctionStatus()).isEqualTo(UNSOLD);
    }

    @DisplayName("최고 입찰자가 있으면 낙찰 처리 및 에스크로가 시작된다.")
    @Test
    void endSoldAuction() {
        // given
        // 1. 실시간 경매중인 auction 엔티티 생성
        Auction liveAuction = saveBottomUpAuction(LIVE);

        // 2. 최고 입찰자 생성 및 입찰 정보 저장
        User bidder = userRepository.save(
                TestFixture.createUser("입찰자").toBuilder()
                        .balance(50000L)
                        .depositedBidBalance(0L)
                        .build()
        );

        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;

        Bid topBid = new Bid(bidder.getId(), bidder.getNickname(), bidAmount, LocalDateTime.now());
        auctionBidRepository.save(liveAuction.getId(), topBid);

        // 3. 기본 배송지 (에스크로 시작 시 필요)
        ShippingAddress shippingAddress = shippingAddressRepository.save(
                TestFixture.createShippingAddress(bidder)
        );

        // when
        List<StreamPublishTask> tasks = auctionService.endAuction(liveAuction.getId());

        // then
        // 1. 엔티티 상태와 최종 가격
        Auction endedAuction = auctionRepository.findById(liveAuction.getId()).orElseThrow();

        assertThat(endedAuction.getAuctionStatus()).isEqualTo(SOLD);
        assertThat(endedAuction.getFinalPrice()).isEqualTo(bidAmount);

        // 2. 에스크로 시작이 호출되었는지 (escrowService 는 mock)
        verify(escrowService).startEscrow(
                eq(topBid),
                any(Auction.class),
                any(ShippingAddress.class)
        );

        // 3. BID_WINNER payload 내용 검증
        BidWinnerResponse winnerResponse = tasks.stream()
                .map(StreamPublishTask::getPayload)
                .filter(BidWinnerResponse.class::isInstance)
                .map(BidWinnerResponse.class::cast)
                .findFirst()
                .orElseThrow();

        BidWinnerResponse.ItemDto itemDto = winnerResponse.item();

        assertThat(itemDto).isNotNull();
        assertThat(itemDto.itemName()).isEqualTo(item.getName());
        assertThat(itemDto.finalPrice()).isEqualTo(bidAmount);

        BidWinnerResponse.ShippingDto shippingDto = winnerResponse.shipping();

        assertThat(shippingDto).isNotNull();
        assertThat(shippingDto.recipientName()).isEqualTo(shippingAddress.getRecipientName());
        assertThat(shippingDto.address()).isEqualTo(shippingAddress.getAddress());
    }

    // ======================== 실시간 입찰 정보 동기화 ========================


    // ======================== 실시간 물품 정보 동기화 ========================


}