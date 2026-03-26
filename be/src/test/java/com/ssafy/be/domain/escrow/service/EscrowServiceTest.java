package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.escrow.dto.response.EscrowDetailResponse;
import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.dto.response.NftReceiptResponse;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import com.ssafy.be.domain.escrow.event.EscrowCompletedEvent;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.escrow.scheduler.EscrowCompleteScheduler;
import com.ssafy.be.domain.escrow.scheduler.EscrowShipmentScheduler;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;

import java.util.List;

import static com.ssafy.be.domain.item.entity.ItemStatus.READY;
import static com.ssafy.be.domain.item.entity.ItemStatus.SOLD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@IntegrationTest
@RecordApplicationEvents
@DisplayName("EscrowService 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class EscrowServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private EscrowService escrowService;
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
    private BottomUpAuctionDetailRepository bottomUpAuctionDetailRepository;
    @Autowired
    private ShippingAddressRepository shippingAddressRepository;
    @Autowired
    private EscrowRepository escrowRepository;
    @Autowired
    private TradeReportRepository tradeReportRepository;
    @Autowired
    private ApplicationEvents applicationEvents;

    @MockitoBean
    private NotificationService notificationService;
    @MockitoBean
    private EscrowShipmentScheduler escrowShipmentScheduler;
    @MockitoBean
    private EscrowCompleteScheduler escrowCompleteScheduler;
    @MockitoBean
    private BlockchainService blockchainService;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║              EscrowService 통합 테스트 Suite 시작            ║");
        IT_LOG.info("║              Layer  : Service → DB                       ║");
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
        clearInvocations(
                notificationService,
                escrowShipmentScheduler,
                escrowCompleteScheduler,
                blockchainService);
    }

    @AfterEach
    void cleanup() {
        tradeReportRepository.deleteAllInBatch();
        escrowRepository.deleteAllInBatch();
        shippingAddressRepository.deleteAllInBatch();
        bottomUpAuctionDetailRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    private record DepositedCtx(User buyer, User sellerUser, Seller seller, Item item, Auction auction,
                                ShippingAddress shipping, Escrow escrow) {}

    private DepositedCtx saveDepositedEscrow() {
        long winning = TestFixture.TEST_ESCROW_WINNING_PRICE;
        User sellerUser = userRepository.save(TestFixture.createUser("판매자"));
        Seller seller = sellerRepository.save(TestFixture.createBusinessSeller(sellerUser));
        User buyer = userRepository.save(TestFixture.createBuyerWithBidDepositForEscrow("구매자", winning));
        Stream stream = streamRepository.save(TestFixture.createStream("에스크로 라이브", seller));
        Item item = itemRepository.save(TestFixture.createEscrowAuctionItem("낙찰 상품", seller));
        BottomUpAuctionDetail detail = TestFixture.createBottomUpAuction(AuctionStatus.LIVE, stream, item);
        Auction auction = auctionRepository.save(detail.getAuction());
        bottomUpAuctionDetailRepository.save(detail);
        ShippingAddress shipping = shippingAddressRepository.save(TestFixture.createShippingAddress(buyer));
        Bid bid = TestFixture.createEscrowWinningBid(buyer.getId(), buyer.getNickname(), winning);
        escrowService.startEscrow(bid, auction, shipping);
        Escrow escrow = escrowRepository.findAllByBuyerUserId(buyer.getId()).getFirst();
        return new DepositedCtx(buyer, sellerUser, seller, item, auction, shipping, escrow);
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 운송장·취소·구매 확정")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class EscrowActionFlowTest {

        @Test
        @Order(1)
        @DisplayName("I-1. 판매자 운송장 등록 시 SHIPPED 및 스케줄러 전환.")
        void registerShipment_success() {
            IT_LOG.info("    [요청] 운송장 등록");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            escrowService.registerShipment(
                    TestFixture.escrowShipmentRegisterRequest(),
                    ctx.escrow().getId(),
                    ctx.sellerUser().getId());

            // then
            Escrow reloaded = escrowRepository.findById(ctx.escrow().getId()).orElseThrow();
            assertThat(reloaded.getEscrowStatus()).isEqualTo(EscrowStatus.SHIPPED);
            assertThat(reloaded.getCarrierName()).isEqualTo("한진");

            verify(escrowShipmentScheduler).cancelScheduledEscrow(ctx.escrow().getId());
            verify(escrowCompleteScheduler).scheduleEscrow(ctx.escrow().getId());

            IT_LOG.info("    [검증] ✔ SHIPPED, shipment 취소·complete 스케줄 등록 호출");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 판매자 수동 취소 시 예치 환급·상품 READY.")
        void manualCancelEscrow_success() {
            IT_LOG.info("    [요청] 판매자 수동 취소");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            escrowService.manualCancelEscrow(
                    TestFixture.escrowManualCancelRequest(ctx.escrow().getId(), "단순 변심"),
                    ctx.escrow().getId(),
                    ctx.sellerUser().getId());

            // then
            Escrow reloaded = escrowRepository.findById(ctx.escrow().getId()).orElseThrow();
            assertThat(reloaded.getEscrowStatus()).isEqualTo(EscrowStatus.CANCELLED);

            User buyerReloaded = userRepository.findById(ctx.buyer().getId()).orElseThrow();
            assertThat(buyerReloaded.getDepositedEscrowBalance()).isZero();

            Item itemReloaded = itemRepository.findById(ctx.item().getId()).orElseThrow();
            assertThat(itemReloaded.getStatus()).isEqualTo(READY);

            verify(escrowShipmentScheduler).cancelScheduledEscrow(ctx.escrow().getId());

            IT_LOG.info("    [검증] ✔ CANCELLED, 구매자 예치 환급, READY");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. 구매자 거래 확정 시 정산·이벤트 발행·민팅 대기.")
        void completeEscrow_success() {
            IT_LOG.info("    [요청] 구매자 거래 확정");
            // given
            DepositedCtx ctx = saveDepositedEscrow();
            long winning = TestFixture.TEST_ESCROW_WINNING_PRICE;
            long fee = (long) (winning * EscrowService.FEE_RATE);
            long settlement = winning - fee;

            escrowService.registerShipment(
                    TestFixture.escrowShipmentRegisterRequest(),
                    ctx.escrow().getId(),
                    ctx.sellerUser().getId());

            // when
            escrowService.completeEscrow(ctx.escrow().getId(), ctx.buyer().getId());

            // then
            Escrow reloaded = escrowRepository.findById(ctx.escrow().getId()).orElseThrow();
            assertThat(reloaded.getEscrowStatus()).isEqualTo(EscrowStatus.COMPLETED);

            User buyerReloaded = userRepository.findById(ctx.buyer().getId()).orElseThrow();
            assertThat(buyerReloaded.getDepositedEscrowBalance()).isZero();

            User sellerUserReloaded = userRepository.findById(ctx.sellerUser().getId()).orElseThrow();
            assertThat(sellerUserReloaded.getBalance()).isEqualTo(settlement);

            assertThat(tradeReportRepository.findAll()).hasSize(2);

            verify(escrowCompleteScheduler).cancelScheduledEscrow(ctx.escrow().getId());

            assertThat(applicationEvents.stream(EscrowCompletedEvent.class).toList())
                    .singleElement()
                    .satisfies(ev -> assertThat(ev.escrowId()).isEqualTo(ctx.escrow().getId()));

            Item itemReloaded = itemRepository.findById(ctx.item().getId()).orElseThrow();
            assertThat(itemReloaded.getStatus()).isEqualTo(SOLD);

            IT_LOG.info("    [검증] ✔ COMPLETED, 정산, EscrowCompletedEvent, SOLD");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Section 2 │ 조회")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class EscrowQueryTest {

        @Test
        @Order(1)
        @DisplayName("I-4. 에스크로 상세 조회 시 낙찰·배송·운송 정보가 채워진다.")
        void getEscrowDetail_success() {
            IT_LOG.info("    [요청] 에스크로 상세");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            EscrowDetailResponse detail = escrowService.getEscrowDetail(ctx.escrow().getId());

            // then
            assertThat(detail.winningInfo().itemName()).isEqualTo("낙찰 상품");
            assertThat(detail.winningInfo().finalPrice()).isEqualTo(TestFixture.TEST_ESCROW_WINNING_PRICE);
            assertThat(detail.shippingAddress().name()).isEqualTo("테스트 수령인");
            IT_LOG.info("    [검증] ✔ EscrowDetailResponse 필드 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-5. 판매자 에스크로 목록 — 미등록 시 SELLER_NOT_FOUND.")
        void getAllSellerEscrows_whenNotSeller() {
            IT_LOG.info("    [요청] 비판매자 계정으로 판매자 에스크로 목록");
            // given
            User buyerOnly = userRepository.save(TestFixture.createUser("구매자만"));

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> escrowService.getAllSellerEscrows(buyerOnly.getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ SELLER_NOT_FOUND");
        }

        @Test
        @Order(3)
        @DisplayName("I-6. 판매자·구매자 에스크로 목록에 낙찰 건이 포함된다.")
        void getAllEscrows_listsDeposited() {
            IT_LOG.info("    [요청] 판매자/구매자 에스크로 목록");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            List<EscrowListResponse> sellerRows = escrowService.getAllSellerEscrows(ctx.sellerUser().getId());
            List<EscrowListResponse> buyerRows = escrowService.getAllBuyerEscrows(ctx.buyer().getId());

            // then
            assertThat(sellerRows).hasSize(1);
            assertThat(sellerRows.getFirst().escrowId()).isEqualTo(ctx.escrow().getId());
            assertThat(buyerRows).hasSize(1);
            assertThat(buyerRows.getFirst().escrowStatus()).isEqualTo(EscrowStatus.DEPOSITED);
            IT_LOG.info("    [검증] ✔ 판매자·구매자 각 1건");
        }

        @Test
        @Order(4)
        @DisplayName("I-7. NFT 영수증 조회 — 민팅 전이면 tokenId·blockNumber는 null.")
        void getNftReceipt_beforeMint() {
            IT_LOG.info("    [요청] NFT 영수증 (미민팅)");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            NftReceiptResponse receipt = escrowService.getNftReceipt(ctx.escrow().getId());

            // then
            assertThat(receipt.escrowId()).isEqualTo(ctx.escrow().getId());
            assertThat(receipt.tokenId()).isNull();
            assertThat(receipt.blockNumber()).isNull();
            verify(blockchainService, never()).getTokenId(any());
            verify(blockchainService, never()).getBlockNumber(any());
            IT_LOG.info("    [검증] ✔ 온체인 조회 미호출, tokenId null");
        }
    }
}
