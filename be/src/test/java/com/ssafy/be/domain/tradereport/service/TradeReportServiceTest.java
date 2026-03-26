package com.ssafy.be.domain.tradereport.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.tradereport.dto.TradeReportListResponse;
import com.ssafy.be.domain.tradereport.entity.TradeType;
import com.ssafy.be.domain.tradereport.repository.TradeReportRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static com.ssafy.be.domain.tradereport.entity.TradeType.SETTLEMENT;
import static com.ssafy.be.domain.tradereport.entity.TradeType.WITHDRAW;
import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
@DisplayName("TradeReport 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class TradeReportServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    private TradeReportService tradeReportService;
    @Autowired
    private TradeReportRepository tradeReportRepository;
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
    private ShippingAddressRepository shippingAddressRepository;
    @Autowired
    private EscrowRepository escrowRepository;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║              TradeReport 통합 테스트 Suite 시작               ║");
        IT_LOG.info("╚════════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        IT_LOG.info("║     Suite 종료  |  총 소요: {}ms{}", total,
                " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
    }

    @AfterEach
    void cleanup() {
        tradeReportRepository.deleteAllInBatch();
        escrowRepository.deleteAllInBatch();
        shippingAddressRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 거래 내역 조회")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class GetTradeReportsTest {

        @Test
        @Order(1)
        @DisplayName("TR-1. SETTLEMENT 건은 상품명이 채워진다.")
        void getAllTradeReports_settlement_mapsItemName() {
            // given
            User sellerUser = userRepository.save(TestFixture.createUser("판매자"));
            Seller seller = sellerRepository.save(TestFixture.createBusinessSeller(sellerUser));
            Stream stream = streamRepository.save(TestFixture.createStream("라이브", seller));
            Item item = itemRepository.save(TestFixture.createEscrowAuctionItem("정산상품", seller));
            Auction auction = auctionRepository.save(
                    TestFixture.createAuction(AuctionType.BOTTOM_UP, AuctionStatus.SOLD, stream, item));
            User buyer = userRepository.save(TestFixture.createUser("구매자"));
            ShippingAddress address = shippingAddressRepository.save(TestFixture.createShippingAddress(buyer));
            var escrow = escrowRepository.save(TestFixture.createDepositedEscrow(
                    50_000L, 0L, auction, buyer, seller, address));

            tradeReportRepository.save(TestFixture.createTradeReport(45_000L, SETTLEMENT, sellerUser, escrow));

            // when
            List<TradeReportListResponse> list =
                    tradeReportService.getAllTradeReports(SETTLEMENT, sellerUser.getId());

            // then
            assertThat(list).hasSize(1);
            assertThat(list.get(0).itemName()).isEqualTo("정산상품");
            assertThat(list.get(0).amount()).isEqualTo(45_000L);
            assertThat(list.get(0).createdAt()).isNotNull();
            IT_LOG.info("    [검증] ✔ SETTLEMENT → itemName 매핑");
        }

        @Test
        @Order(2)
        @DisplayName("TR-2. 다른 유저 id로 조회하면 빈 목록이다.")
        void getAllTradeReports_otherUser_empty() {
            // given
            User owner = userRepository.save(TestFixture.createUser("소유자"));
            tradeReportRepository.save(TestFixture.createTradeReport(1_000L, TradeType.CHARGE, owner));

            User other = userRepository.save(TestFixture.createUser("타인"));

            // when
            List<TradeReportListResponse> list =
                    tradeReportService.getAllTradeReports(TradeType.CHARGE, other.getId());

            // then
            assertThat(list).isEmpty();
            IT_LOG.info("    [검증] ✔ userId 필터");
        }
    }
}
