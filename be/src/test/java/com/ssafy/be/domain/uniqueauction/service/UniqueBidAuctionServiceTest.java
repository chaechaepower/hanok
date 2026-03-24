package com.ssafy.be.domain.uniqueauction.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuctionDetail;
import com.ssafy.be.domain.uniqueaction.exception.UniqueBidAuctionErrorCode;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionDetailRepository;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidRepository;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.exception.StompException;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@IntegrationTest
@DisplayName("UniqueBidAuction 통합 테스트 (Smoke + Step-up)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class UniqueBidAuctionServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired private UniqueBidAuctionService uniqueBidAuctionService;
    @Autowired private UserRepository userRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private StreamRepository streamRepository;
    @Autowired private ItemRepository itemRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private UniqueBidAuctionDetailRepository uniqueBidAuctionDetailRepository;
    @Autowired private UniqueBidRepository uniqueBidRepository;
    @Autowired private ShippingAddressRepository shippingAddressRepository;

    private User sellerUser;
    private Seller seller;
    private Stream stream;
    private Item item;
    private Auction auction;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║       UniqueBidAuction 통합 테스트 Suite 시작              ║");
        IT_LOG.info("║  Layer  : Service → Repository(DB/Redis)                   ║");
        IT_LOG.info("║  시나리오: 총 경매(I-1), 입찰(I-2~I-3), 에스크로 및 집계(I-4~I-5) ║");
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
        sellerUser = userRepository.save(TestFixture.createUser("판매자"));
        seller = sellerRepository.save(TestFixture.createSeller(sellerUser));
        stream = streamRepository.save(TestFixture.createStream("테스트 라이브 방송", seller));
        item = itemRepository.save(TestFixture.createItem("테스트 상품"));

        // 기본 옥션 하나 생성해두기
        auction = auctionRepository.save(
                Auction.builder()
                        .auctionType(AuctionType.UNIQUE_TOP)
                        .auctionDuration(TestFixture.TEST_AUCTION_DURATION_SEC)
                        .auctionStatus(AuctionStatus.INTRODUCING)
                        .stream(stream)
                        .item(item)
                        .build()
        );

        uniqueBidAuctionDetailRepository.save(
                UniqueBidAuctionDetail.builder()
                        .auction(auction)
                        .minPrice(1000L)
                        .maxPrice(100000L)
                        .build()
        );
    }
    
    @AfterEach
    void tearDown() {
        auctionRepository.findAll().forEach(a -> {
            uniqueBidRepository.deleteAll(a.getId());
        });
        shippingAddressRepository.deleteAllInBatch();
        uniqueBidAuctionDetailRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    // ═══ Section 1 : 경매 시작 테스트 ════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 유일 최고가 경매 시작 (Start)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionStartTest {
        @Test
        @Order(1)
        @DisplayName("I-1. 정상적인 경매 시작 흐름")
        void startAuction_Success() {
            IT_LOG.info("    [요청] 유일 최고가 경매 시작 호출");
            UniqueBidStartRequest request = UniqueBidStartRequest.builder().auctionId(auction.getId()).build();

            List<StreamPublishTask> tasks = uniqueBidAuctionService.startAuction(stream.getId(), request, sellerUser.getId());

            Auction savedAuction = auctionRepository.findById(auction.getId()).orElseThrow();
            assertThat(savedAuction.getAuctionStatus()).isEqualTo(AuctionStatus.LIVE);
            assertThat(savedAuction.getStartedAt()).isNotNull();
            assertThat(tasks).isNotEmpty();
            
            IT_LOG.info("    [검증] ✔ 경매 상태 LIVE 변경 및 Publish Tasks 반환 확인");
        }
    }

    // ═══ Section 2 : 경매 입찰 테스트 ════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 유일 최고가 입찰 (Bid Place)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionBidTest {
        
        @BeforeEach
        void auctionLive() {
            auction = auctionRepository.findById(auction.getId()).get();
            auction.startAuction("now"); // sets status to LIVE
            auction = auctionRepository.save(auction);
        }

        @Test
        @Order(1)
        @DisplayName("I-2. 유효 범위 내 입찰 성공")
        void placeBid_Success() {
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).depositedBidBalance(0L).build());
            
            IT_LOG.info("    [요청] 45000원 입찰 처리");
            UniqueBidPlaceRequest request = UniqueBidPlaceRequest.builder().auctionId(auction.getId()).amount(45000L).build();
            long participantCount = uniqueBidAuctionService.placeBid(request, bidder.getId());

            assertThat(participantCount).isEqualTo(1);
            User updatedBidder = userRepository.findById(bidder.getId()).orElseThrow();
            assertThat(updatedBidder.getDepositedBidBalance()).isEqualTo(45000L);
            
            IT_LOG.info("    [검증] ✔ 참여자 수 증가 및 입찰자 잔액 차감(락) 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-3. 유효 범위를 벗어난 금액으로 입찰 시 예외발생")
        void placeBid_InvalidAmount() {
            User bidder = userRepository.save(TestFixture.createUser("입찰자").toBuilder().balance(50000L).build());
            
            IT_LOG.info("    [요청] 최소 입찰가(1000) 미만인 500원 제출");
            UniqueBidPlaceRequest request = UniqueBidPlaceRequest.builder().auctionId(auction.getId()).amount(500L).build();
            
            StompException exception = assertThrows(StompException.class, () -> {
                uniqueBidAuctionService.placeBid(request, bidder.getId());
            });

            assertThat(exception.getErrorType()).isEqualTo(UniqueBidAuctionErrorCode.INVALID_AMOUNT);
            
            IT_LOG.info("    [검증] ✔ INVALID_AMOUNT 예외 정상 발생 확인");
        }
    }

    // ═══ Section 3 : 경매 집계 및 낙찰 테스트 ═════════════════════
    @Nested
    @Order(3)
    @DisplayName("Section 3 │ 유일 최고가 집계 및 낙찰 (Calculate)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionCalculateTest {
        
        @BeforeEach
        void auctionLive() {
            auction = auctionRepository.findById(auction.getId()).get();
            auction.startAuction("now");
            auction = auctionRepository.save(auction);
        }

        @Test
        @Order(1)
        @DisplayName("I-4. 참여자가 없어 유찰되는 경우")
        void aggregate_Unsold() {
            IT_LOG.info("    [요청] 입찰 건 없는 상태로 집계 시작");
            UniqueBidCalculateRequest request = UniqueBidCalculateRequest.builder().auctionId(auction.getId()).build();

            List<StreamPublishTask> publishTasks = uniqueBidAuctionService.aggregate(request);

            Auction endedAuction = auctionRepository.findById(auction.getId()).orElseThrow();
            assertThat(endedAuction.getAuctionStatus()).isEqualTo(AuctionStatus.UNSOLD);
            assertThat(publishTasks).isNotEmpty();
            
            IT_LOG.info("    [검증] ✔ UNSOLD 처리 완료 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-5. 중복 입찰자 탈락 및 유일 최고가 승리자 도출")
        void aggregate_Sold() {
            User bidder1 = userRepository.save(TestFixture.createUser("입찰자1").toBuilder().balance(100000L).build());
            User bidder2 = userRepository.save(TestFixture.createUser("입찰자2").toBuilder().balance(100000L).build());
            User bidder3 = userRepository.save(TestFixture.createUser("입찰자3").toBuilder().balance(100000L).build());
            shippingAddressRepository.save(TestFixture.createShippingAddress(bidder2));

            IT_LOG.info("    [준비] 세 명의 입찰자 참여: 50000(B1), 50000(B3), 45000(B2)");
            uniqueBidAuctionService.placeBid(UniqueBidPlaceRequest.builder().auctionId(auction.getId()).amount(50000L).build(), bidder1.getId());
            uniqueBidAuctionService.placeBid(UniqueBidPlaceRequest.builder().auctionId(auction.getId()).amount(50000L).build(), bidder3.getId());
            uniqueBidAuctionService.placeBid(UniqueBidPlaceRequest.builder().auctionId(auction.getId()).amount(45000L).build(), bidder2.getId());

            IT_LOG.info("    [요청] 눈치게임 집계 시작");
            UniqueBidCalculateRequest request = UniqueBidCalculateRequest.builder().auctionId(auction.getId()).build();
            List<StreamPublishTask> publishTasks = uniqueBidAuctionService.aggregate(request);

            Auction endedAuction = auctionRepository.findById(auction.getId()).orElseThrow();
            assertThat(endedAuction.getAuctionStatus()).isEqualTo(AuctionStatus.SOLD);
            assertThat(endedAuction.getFinalPrice()).isEqualTo(45000L);
            assertThat(publishTasks).isNotEmpty();
            assertThat(publishTasks).anyMatch(
                    t -> DestType.PRIVATE.equals(t.getDestType()) && bidder2.getId().equals(t.getUserId()));
            
            IT_LOG.info("    [검증] ✔ 50000원 중복 탈락 처리 및 45000원 유일 입찰자(B2) 최종 승리 확인!");
        }
    }

    // ═══ Section 4 : 잔액 부족 입찰 테스트 ══════════════════════
    @Nested
    @Order(4)
    @DisplayName("Section 4 │ 잔액 부족 예외 처리")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class InsufficientBalanceTest {

        @BeforeEach
        void auctionLive() {
            auction = auctionRepository.findById(auction.getId()).get();
            auction.startAuction("now");
            auction = auctionRepository.save(auction);
        }

        @Test
        @Order(1)
        @DisplayName("I-6. 잔액 0원인 입찰자가 유효 금액 입찰 시 예외 발생")
        void placeBid_InsufficientBalance() {
            // balance=0 → user.depositBidBalance() 내부 잔액 부족 예외 유발
            User brokeUser = userRepository.save(
                    TestFixture.createUser("brokeUser_" + System.currentTimeMillis()).toBuilder()
                            .balance(0L)
                            .depositedBidBalance(0L)
                            .build());

            IT_LOG.info("    [요청] 잔액 0원인 유저가 45000원 입찰 시도");
            UniqueBidPlaceRequest request = UniqueBidPlaceRequest.builder()
                    .auctionId(auction.getId()).amount(45000L).build();

            assertThrows(Exception.class, () ->
                    uniqueBidAuctionService.placeBid(request, brokeUser.getId()));

            IT_LOG.info("    [검증] ✔ 잔액 부족 시 예외 전파 확인");
        }
    }
}
