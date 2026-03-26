package com.ssafy.be.domain.escrow.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.escrow.entity.Escrow;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import com.ssafy.be.domain.escrow.exception.EscorwErrorCode;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.escrow.scheduler.EscrowCompleteScheduler;
import com.ssafy.be.domain.escrow.scheduler.EscrowShipmentScheduler;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static com.ssafy.be.domain.item.entity.ItemStatus.READY;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.clearInvocations;

@IntegrationTest
@DisplayName("EscrowCancellationService 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class EscrowCancellationServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private EscrowCancellationService escrowCancellationService;
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
        IT_LOG.info("║        EscrowCancellationService 통합 테스트 Suite 시작      ║");
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
    @DisplayName("Section 1 │ 자동 취소")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AutoCancelTest {

        @Test
        @Order(1)
        @DisplayName("I-1. DEPOSITED 상태면 자동 취소 시 예치 환급·상품 READY·판매자 패널티 증가.")
        void autoCancelEscrow_success() {
            IT_LOG.info("    [요청] 운송장 미등록 자동 취소 (DEPOSITED)");
            // given
            DepositedCtx ctx = saveDepositedEscrow();

            // when
            escrowCancellationService.autoCancelEscrow(ctx.escrow().getId());

            // then
            Escrow reloaded = escrowRepository.findById(ctx.escrow().getId()).orElseThrow();
            assertThat(reloaded.getEscrowStatus()).isEqualTo(EscrowStatus.CANCELLED);
            assertThat(reloaded.getCancelReason()).contains("72시간");

            User buyerReloaded = userRepository.findById(ctx.buyer().getId()).orElseThrow();
            assertThat(buyerReloaded.getDepositedEscrowBalance()).isZero();

            Item itemReloaded = itemRepository.findById(ctx.item().getId()).orElseThrow();
            assertThat(itemReloaded.getStatus()).isEqualTo(READY);

            Seller sellerReloaded = sellerRepository.findById(ctx.seller().getId()).orElseThrow();
            assertThat(sellerReloaded.getPenaltyCount()).isEqualTo(1);

            IT_LOG.info("    [검증] ✔ CANCELLED, 구매자 에스크로 예치 0, 상품 READY, penaltyCount=1");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 존재하지 않는 escrowId면 ESCROW_NOT_FOUND.")
        void autoCancelEscrow_notFound() {
            IT_LOG.info("    [요청] 없는 escrowId 자동 취소");
            // given
            long unknownId = 9_999_999L;

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> escrowCancellationService.autoCancelEscrow(unknownId));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(EscorwErrorCode.ESCROW_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ ESCROW_NOT_FOUND");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. DEPOSITED가 아니면 ESCROW_INVALID_STATUS.")
        void autoCancelEscrow_invalidStatus() {
            IT_LOG.info("    [요청] SHIPPED 상태에서 자동 취소 시도");
            // given
            DepositedCtx ctx = saveDepositedEscrow();
            escrowService.registerShipment(
                    TestFixture.escrowShipmentRegisterRequest(),
                    ctx.escrow().getId(),
                    ctx.sellerUser().getId());

            // when
            GlobalException ex = assertThrows(GlobalException.class,
                    () -> escrowCancellationService.autoCancelEscrow(ctx.escrow().getId()));

            // then
            assertThat(ex.getErrorCode()).isEqualTo(EscorwErrorCode.ESCROW_INVALID_STATUS);
            IT_LOG.info("    [검증] ✔ ESCROW_INVALID_STATUS");
        }
    }
}
