package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.escrow.scheduler.EscrowCompleteScheduler;
import com.ssafy.be.domain.escrow.scheduler.EscrowShipmentScheduler;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.tradereport.entity.TradeReport;
import com.ssafy.be.domain.tradereport.entity.TradeType;
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

import static com.ssafy.be.domain.item.entity.ItemStatus.SOLD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.clearInvocations;

@IntegrationTest
@DisplayName("EscrowCompleteService 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class EscrowCompleteServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private EscrowCompleteService escrowCompleteService;
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

    @MockitoBean
    private NotificationService notificationService;
    @MockitoBean
    private EscrowShipmentScheduler escrowShipmentScheduler;
    @MockitoBean
    private EscrowCompleteScheduler escrowCompleteScheduler;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║          EscrowCompleteService 통합 테스트 Suite 시작        ║");
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
        clearInvocations(notificationService, escrowShipmentScheduler, escrowCompleteScheduler);
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
    @DisplayName("Section 1 │ 자동 거래 확정")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AutoCompleteTest {

        @Test
        @Order(1)
        @DisplayName("I-1. SHIPPED 상태면 자동 확정 시 정산·거래내역·상품 SOLD 처리.")
        void autoCompleteEscrow_success() {
            IT_LOG.info("    [요청] 자동 거래 확정 (SHIPPED → COMPLETED)");
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
            escrowCompleteService.autoCompleteEscrow(ctx.escrow().getId());

            // then
            Escrow reloaded = escrowRepository.findById(ctx.escrow().getId()).orElseThrow();
            assertThat(reloaded.getEscrowStatus()).isEqualTo(EscrowStatus.COMPLETED);

            User buyerReloaded = userRepository.findById(ctx.buyer().getId()).orElseThrow();
            assertThat(buyerReloaded.getDepositedEscrowBalance()).isZero();

            User sellerUserReloaded = userRepository.findById(ctx.sellerUser().getId()).orElseThrow();
            assertThat(sellerUserReloaded.getBalance()).isEqualTo(settlement);

            assertThat(tradeReportRepository.findAll())
                    .hasSize(2)
                    .extracting(TradeReport::getAmount, TradeReport::getTradeType)
                    .containsExactlyInAnyOrder(
                            tuple(settlement, TradeType.SETTLEMENT),
                            tuple(-winning, TradeType.SETTLEMENT));

            Item itemReloaded = itemRepository.findById(ctx.item().getId()).orElseThrow();
            assertThat(itemReloaded.getStatus()).isEqualTo(SOLD);

            IT_LOG.info("    [검증] ✔ COMPLETED, 정산·SETTLEMENT 2건, 상품 SOLD");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 존재하지 않는 escrowId면 ESCROW_NOT_FOUND.")
        void autoCompleteEscrow_notFound() {
            IT_LOG.info("    [요청] 없는 escrowId 자동 확정");
            // given
            long unknownId = 9_999_999L;

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> escrowCompleteService.autoCompleteEscrow(unknownId));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(EscorwErrorCode.ESCROW_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ ESCROW_NOT_FOUND");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. SHIPPED가 아니면 ESCROW_INVALID_STATUS.")
        void autoCompleteEscrow_invalidStatus() {
            IT_LOG.info("    [요청] DEPOSITED 상태에서 자동 확정 시도");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> escrowCompleteService.autoCompleteEscrow(ctx.escrow().getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(EscorwErrorCode.ESCROW_INVALID_STATUS);
            IT_LOG.info("    [검증] ✔ ESCROW_INVALID_STATUS");
        }
    }
}
