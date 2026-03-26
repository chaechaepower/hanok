package com.ssafy.be.domain.bottomupauction.service;

import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.bottomupauction.dto.request.AuctionStartRequest;
import com.ssafy.be.domain.bottomupauction.dto.request.BidPlaceRequest;
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
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.exception.StompException;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.List;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;

@IntegrationTest
@DisplayName("BottomUpAuction 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class BottomUpAuctionServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private AuctionService auctionService;
    @Autowired
    private BottomUpAuctionService bottomUpAuctionService;
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
    private ShippingAddressRepository shippingAddressRepository;
    @Autowired
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private EscrowService escrowService;

    private User sellerUser;
    private Seller seller;
    private Stream stream;
    private Item item;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║           BottomUpAuction 통합 테스트 Suite 시작               ║");
        IT_LOG.info("║             Layer  : Service → Redis / DB                  ║");
        IT_LOG.info("║         시나리오: 물품소개, 경매시작, 상향식 입찰, 에스크로 집계        ║");
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║     Suite 종료  |  총 소요: {}ms{}",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @BeforeEach
    void setUp() {
        clearInvocations(escrowService);
        sellerUser = userRepository.save(TestFixture.createUser("판매자"));
        seller = sellerRepository.save(TestFixture.createBusinessSeller(sellerUser));
        stream = streamRepository.save(TestFixture.createStream("테스트 라이브 방송", seller));
        item = itemRepository.save(TestFixture.createItem("테스트 상품"));
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
        bottomUpAuctionDetailRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    // ═══ Section 1 : 물품 소개 및 경매 시작 ════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 경매 시작")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionStartFlowTest {

        @Test
        @Order(1)
        @DisplayName("I-1. 소개중인 물품의 경매를 시작한다.")
        void startAuction() {
            IT_LOG.info("    [요청] 상향식 경매 시작");
            // given
            Auction introductingAuction = saveBottomUpAuction(INTRODUCING);
            AuctionStartRequest request = AuctionStartRequest.builder().auctionId(introductingAuction.getId()).build();

            // when
            List<StreamPublishTask> tasks = bottomUpAuctionService.startAuction(request, stream.getId(), sellerUser.getId());

            // then
            Auction savedAuction = auctionRepository.findById(introductingAuction.getId()).orElseThrow();
            assertThat(savedAuction.getAuctionStatus()).isEqualTo(LIVE);
            assertThat(savedAuction.getStartedAt()).isNotNull();
            assertThat(auctionTimerRepository.existsByAuctionId(introductingAuction.getId())).isTrue();

            AuctionStartResponse response = tasks.stream()
                    .map(StreamPublishTask::getPayload)
                    .filter(AuctionStartResponse.class::isInstance)
                    .map(AuctionStartResponse.class::cast)
                    .findFirst().orElseThrow();

            assertThat(response.item().name()).isEqualTo("테스트 상품");
            assertThat(response.item().startPrice()).isEqualTo(10000L);
            IT_LOG.info("    [검증] ✔ LIVE 상태 변경 및 Redis 타이머 등록 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-1b. 설명중 상태가 아닌 경매는 시작할 수 없다.")
        void startAuction_whenNotIntroducing() {
            IT_LOG.info("    [요청] LIVE 상태 경매에 경매 시작 시도");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            AuctionStartRequest request = AuctionStartRequest.builder().auctionId(liveAuction.getId()).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> bottomUpAuctionService.startAuction(request, stream.getId(), sellerUser.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_NOT_INTRODUCING);
            IT_LOG.info("    [검증] ✔ AUCTION_NOT_INTRODUCING 예외 확인");
        }

        @Test
        @Order(3)
        @DisplayName("I-1c. 해당 스트림 호스트가 아니면 경매 시작할 수 없다.")
        void startAuction_whenNotStreamHost() {
            IT_LOG.info("    [요청] 타 스트림 ID로 경매 시작 시도 (호스트 불일치)");
            // given
            User otherSellerUser = userRepository.save(TestFixture.createUser("다른 판매자"));
            Seller otherSeller = sellerRepository.save(TestFixture.createBusinessSeller(otherSellerUser));
            Stream otherStream = streamRepository.save(TestFixture.createStream("다른 방송", otherSeller));

            Auction introducingAuction = saveBottomUpAuction(INTRODUCING);
            AuctionStartRequest request = AuctionStartRequest.builder().auctionId(introducingAuction.getId()).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> bottomUpAuctionService.startAuction(request, otherStream.getId(), sellerUser.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_UNAUTHORIZED);
            IT_LOG.info("    [검증] ✔ AUCTION_UNAUTHORIZED 예외 확인");
        }

        @Test
        @Order(4)
        @DisplayName("I-1d. 판매자 등록이 안되있는 경우, 경매를 시작할 수 없다.")
        void startAuction_whenSellerNotFound() {
            IT_LOG.info("    [요청] 셀러 미등록 사용자로 경매 시작 시도");
            // given
            User buyerOnly = userRepository.save(TestFixture.createUser("구매자만"));
            Auction introducingAuction = saveBottomUpAuction(INTRODUCING);
            AuctionStartRequest request = AuctionStartRequest.builder().auctionId(introducingAuction.getId()).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> bottomUpAuctionService.startAuction(request, stream.getId(), buyerOnly.getId()));

            assertThat(ex.getErrorType()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ SELLER_NOT_FOUND 예외 확인");
        }
    }

    // ═══ Section 2 : 경매 입찰 ════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 실시간 상향식 입찰 (Bid Place)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionBidTest {

        @Test
        @Order(1)
        @DisplayName("I-3. 정상 입찰 — 스나이핑 구간이 아니면 snipingTimer는 null")
        void placeBid_Success() {
            IT_LOG.info("    [요청] 상향식 경매 실시간 입찰 수행 (잔여 시간 충분 → 스나이핑 미발동)");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).depositedBidBalance(0L).build());
            auctionTimerRepository.save(liveAuction.getId(), liveAuction.getAuctionDuration());

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest request = BidPlaceRequest.builder().auctionId(liveAuction.getId()).amount(bidAmount).build();

            // when
            List<StreamPublishTask> tasks = bottomUpAuctionService.placeBidWithLock(request, stream.getId(), bidder.getId());

            // then
            BidPlaceResponse response = tasks.stream()
                    .map(StreamPublishTask::getPayload)
                    .filter(BidPlaceResponse.class::isInstance)
                    .map(BidPlaceResponse.class::cast)
                    .findFirst().orElseThrow();

            assertThat(response.bidInfo().nickname()).isEqualTo(bidder.getNickname());
            assertThat(response.bidInfo().amount()).isEqualTo(bidAmount);
            assertThat(response.snipingTimer())
                    .as("일반 구간 입찰에서는 스나이핑 연장 없음 → snipingTimer 유지 null")
                    .isNull();
            IT_LOG.info("    [검증] ✔ 입찰 Payload 정상, snipingTimer=null (스나이핑 미발동)");
        }

        @Test
        @Order(2)
        @DisplayName("I-4. 시작가 미만 입찰 시 방어 (AUCTION_BID_BELOW_START_PRICE)")
        void placeBid_BelowStartPrice() {
            IT_LOG.info("    [요청] 시작가 10000원 보다 낮은 9999원으로 입찰 시도");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).build());

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE - 1;
            BidPlaceRequest request = BidPlaceRequest.builder().auctionId(liveAuction.getId()).amount(bidAmount).build();

            // when // then
            StompException ex = assertThrows(StompException.class, () -> {
                bottomUpAuctionService.placeBidWithLock(request, stream.getId(), bidder.getId());
            });

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_BID_BELOW_START_PRICE);
            IT_LOG.info("    [검증] ✔ AUCTION_BID_BELOW_START_PRICE 예외 발생 확인");
        }

        @Test
        @Order(3)
        @DisplayName("I-5. 계좌 잔액이 부족한 상태에서 고액 입찰 시 방어 (Exception)")
        void placeBid_InsufficientBalance() {
            IT_LOG.info("    [요청] 잔액이 부족한 상태로 무리한 고액 입찰 시도");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(100L).build());

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest request = BidPlaceRequest.builder().auctionId(liveAuction.getId()).amount(bidAmount)
                    .build();

            // when // then
            StompException ex = assertThrows(StompException.class, () -> {
                bottomUpAuctionService.placeBidWithLock(request, stream.getId(), bidder.getId());
            });

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_BID_INSUFFICIENT_BALANCE);
            IT_LOG.info("    [검증] ✔ AUCTION_BID_INSUFFICIENT_BALANCE 예외 발생 확인");
        }

        @Test
        @Order(4)
        @DisplayName("I-6. 스나이핑 구간 입찰 시 snipingTimer 설정 및 타이머 연장")
        void placeBid_SnipingExtendsTimer() {
            IT_LOG.info("    [요청] 경매 종료 직전(3초 남음) 상황에서 돌발 스나이핑 입찰 발생");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).build());
            auctionTimerRepository.save(liveAuction.getId(), 3); // 3초 남음

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest request = BidPlaceRequest.builder().auctionId(liveAuction.getId()).amount(bidAmount)
                    .build();

            // when
            List<StreamPublishTask> tasks = bottomUpAuctionService.placeBidWithLock(request, stream.getId(), bidder.getId());

            // then
            BidPlaceResponse response = tasks.stream()
                    .map(StreamPublishTask::getPayload)
                    .filter(BidPlaceResponse.class::isInstance)
                    .map(BidPlaceResponse.class::cast)
                    .findFirst().orElseThrow();

            assertThat(response.snipingTimer()).isNotNull();
            assertThat(response.snipingTimer().durationSeconds()).isEqualTo(5); // 스나이핑 임계시간으로 재설정됨
            IT_LOG.info("    [검증] ✔ snipingTimer가 발동되어 수명의 연장 처리가 되었음 확인");
        }

        @Test
        @Order(5)
        @DisplayName("I-7. 판매자 스스로 입찰할 수 없다.")
        void placeBid_whenSellerSelfBid() {
            IT_LOG.info("    [요청] 스트림 호스트(판매자) 본인 입찰 시도");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            auctionTimerRepository.save(liveAuction.getId(), liveAuction.getAuctionDuration());

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest request = BidPlaceRequest.builder().auctionId(liveAuction.getId()).amount(bidAmount).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> bottomUpAuctionService.placeBidWithLock(request, stream.getId(), sellerUser.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_SELF_BID_NOT_ALLOWED);
            IT_LOG.info("    [검증] ✔ AUCTION_SELF_BID_NOT_ALLOWED 예외 확인");
        }

        @Test
        @Order(6)
        @DisplayName("I-8. LIVE가 아닌 경매에는 입찰할 수 없다.")
        void placeBid_whenNotLive() {
            IT_LOG.info("    [요청] INTRODUCING 경매에 입찰 시도");
            // given
            Auction introducingAuction = saveBottomUpAuction(INTRODUCING);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).build());

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest request = BidPlaceRequest.builder().auctionId(introducingAuction.getId()).amount(bidAmount).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> bottomUpAuctionService.placeBidWithLock(request, stream.getId(), bidder.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_NOT_LIVE);
            IT_LOG.info("    [검증] ✔ AUCTION_NOT_LIVE 예외 확인");
        }
    }

    // ═══ Section 3 : 경매 종료 및 에스크로 ════════════════════════════
    @Nested
    @Order(3)
    @DisplayName("Section 3 │ 상향식 경매 종료 시나리오")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionEndTest {

        @Test
        @Order(1)
        @DisplayName("I-9. 아무도 입찰하지 않고 타이머 완전 종료 시 유찰 처리된다.")
        void end_UnsoldAuction() {
            IT_LOG.info("    [요청] 경매 시간 초과 후 아무도 입찰안한 상황에서의 종료 결산");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);

            // when
            bottomUpAuctionService.endAuction(liveAuction.getId());

            // then
            Auction endedAuction = auctionRepository.findById(liveAuction.getId()).orElseThrow();
            assertThat(endedAuction.getAuctionStatus()).isEqualTo(UNSOLD);
            IT_LOG.info("    [검증] ✔ UNSOLD(유찰) 처리 검증 완료");
        }

        @Test
        @Order(2)
        @DisplayName("I-10. 최고 입찰자가 존재할 때 낙찰 처리 및 에스크로 서비스 인계")
        void end_SoldAuction() {
            IT_LOG.info("    [요청] 입찰자가 존재하는 상태로 경매 종달 처리");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).build());
            shippingAddressRepository.save(TestFixture.createShippingAddress(bidder));

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            Bid topBid = new Bid(bidder.getId(), bidder.getNickname(), bidAmount, LocalDateTime.now());
            auctionBidRepository.save(liveAuction.getId(), topBid); // 탑 입찰 등록

            // when
            List<StreamPublishTask> tasks = bottomUpAuctionService.endAuction(liveAuction.getId());

            // then
            Auction endedAuction = auctionRepository.findById(liveAuction.getId()).orElseThrow();
            assertThat(endedAuction.getAuctionStatus()).isEqualTo(SOLD);
            assertThat(endedAuction.getFinalPrice()).isEqualTo(bidAmount);

            verify(escrowService).startEscrow(eq(topBid), any(Auction.class), any(ShippingAddress.class));

            BidWinnerResponse winnerResponse = tasks.stream()
                    .map(StreamPublishTask::getPayload)
                    .filter(BidWinnerResponse.class::isInstance)
                    .map(BidWinnerResponse.class::cast)
                    .findFirst().orElseThrow();

            assertThat(winnerResponse.item().finalPrice()).isEqualTo(bidAmount);
            IT_LOG.info("    [검증] ✔ SOLD(낙찰) 처리 및 외부 컴포넌트(에스크로 모듈) 정상 호출 확인");
        }

        @Test
        @Order(3)
        @DisplayName("I-11. 입찰은 있으나 기본 배송지가 없으면 낙찰될 수 없다.")
        void end_whenBidExistsButNoDefaultShipping() {
            IT_LOG.info("    [요청] 입찰만 있고 기본 배송지 없는 상태로 경매 종료");
            // given
            Auction liveAuction = saveBottomUpAuction(LIVE);
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).build());
            // 배송지 미저장

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            Bid topBid = new Bid(bidder.getId(), bidder.getNickname(), bidAmount, LocalDateTime.now());
            auctionBidRepository.save(liveAuction.getId(), topBid);

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> bottomUpAuctionService.endAuction(liveAuction.getId()));

            assertThat(ex.getErrorType()).isEqualTo(ShippingAddressErrorCode.DEFAULT_SHIPPING_ADDRESS_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ DEFAULT_SHIPPING_ADDRESS_NOT_FOUND 예외 확인");
        }
    }

    private Auction saveBottomUpAuction(AuctionStatus status) {
        BottomUpAuctionDetail detail = TestFixture.createBottomUpAuction(status, stream, item);
        Auction saved = auctionRepository.save(detail.getAuction());
        bottomUpAuctionDetailRepository.save(detail);
        return saved;
    }
}