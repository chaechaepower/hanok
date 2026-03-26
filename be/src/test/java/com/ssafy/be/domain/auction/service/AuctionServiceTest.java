package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.ItemIntroduceRequest;
import com.ssafy.be.domain.auction.dto.response.ItemSyncResponse;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.bottomupauction.exception.AuctionErrorCode;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuctionDetail;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionDetailRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.extension.IntegrationTestExtension;
import com.ssafy.be.global.websocket.exception.StompException;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.INTRODUCING;
import static com.ssafy.be.domain.auction.entity.AuctionStatus.READY;
import static com.ssafy.be.domain.item.entity.AuctionType.BOTTOM_UP;
import static com.ssafy.be.domain.item.entity.AuctionType.UNIQUE_TOP;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@IntegrationTest
@DisplayName("Auction 통합 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class AuctionServiceTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║              Auction 통합 테스트 Suite 시작                    ║");
        IT_LOG.info("║         Layer  : Service → Repository / Redis              ║");
        IT_LOG.info("║     시나리오: 물품 소개(I-1~4), 스트림 경매 동기화(I-5~6)           ║");
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

    @Autowired
    private AuctionService auctionService;
    @Autowired
    private AuctionRepository auctionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SellerRepository sellerRepository;
    @Autowired
    private StreamRepository streamRepository;
    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private ShippingAddressRepository shippingAddressRepository;
    @Autowired
    private BottomUpAuctionDetailRepository bottomUpAuctionDetailRepository;
    @Autowired
    private UniqueBidAuctionDetailRepository uniqueBidAuctionDetailRepository;
    @Autowired
    private StringRedisTemplate redisTemplate;

    private User sellerUser;
    private Seller seller;
    private Stream stream;
    private Item item;

    @BeforeEach
    void setUp() {
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
        uniqueBidAuctionDetailRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    // ═══ Section 1 : 경매 설명 테스트 ════════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 경매 설명 시작 (Start)")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class AuctionStartTest {
        @Test
        @Order(1)
        @DisplayName("I-1. 라이브 스트림 호스트는 물품 소개를 할 수 있다.")
        void introduceItem() {
            IT_LOG.info("    [요청] 물품 소개 모드 전환");
            // given
            Auction readyAuction = saveBottomUpAuction(READY);
            ItemIntroduceRequest request = ItemIntroduceRequest.builder().auctionId(readyAuction.getId()).build();

            // when
            auctionService.introduceItem(request, stream.getId(), sellerUser.getId());

            // then
            Auction introducedAuction = auctionRepository.findById(readyAuction.getId()).orElseThrow();
            assertThat(introducedAuction.getAuctionStatus()).isEqualTo(INTRODUCING);
            IT_LOG.info("    [검증] ✔ INTRODUCING 상태 변경 확인");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 해당 스트림 호스트만 경매 설명 시작을 할 수 있다.")
        void introduceItem_throwsWhenNotStreamHost() {
            IT_LOG.info("    [요청] 호스트가 아닌 사용자로 물품 소개 시도");
            // given
            User otherUser = userRepository.save(TestFixture.createUser("다른 판매자"));
            sellerRepository.save(TestFixture.createBusinessSeller(otherUser));

            Auction readyAuction = saveBottomUpAuction(READY);
            ItemIntroduceRequest request = ItemIntroduceRequest.builder().auctionId(readyAuction.getId()).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> auctionService.introduceItem(request, stream.getId(), otherUser.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_UNAUTHORIZED);
            IT_LOG.info("    [검증] ✔ AUCTION_UNAUTHORIZED 예외 확인");
        }

        @Test
        @Order(3)
        @DisplayName("I-3. 존재하지 않는 경매 ID면 경매를 시작할 수 없다.")
        void introduceItem_throwsWhenAuctionMissing() {
            IT_LOG.info("    [요청] 존재하지 않는 경매 ID로 물품 소개 시도");
            // given
            ItemIntroduceRequest request = ItemIntroduceRequest.builder().auctionId(999_999L).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> auctionService.introduceItem(request, stream.getId(), sellerUser.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_NOT_FOUND);
            IT_LOG.info("    [검증] ✔ AUCTION_NOT_FOUND 예외 확인");
        }

        @Test
        @Order(4)
        @DisplayName("I-4. 경매 준비중인 상태가 아니면 설명을 시작할 수 없다.")
        void introduceItem_throwsWhenNotReady() {
            IT_LOG.info("    [요청] READY가 아닌(INTRODUCING) 경매에 물품 소개 시도");
            // given
            Auction auction = saveBottomUpAuction(INTRODUCING);
            ItemIntroduceRequest request = ItemIntroduceRequest.builder().auctionId(auction.getId()).build();

            // when // then
            StompException ex = assertThrows(StompException.class,
                    () -> auctionService.introduceItem(request, stream.getId(), sellerUser.getId()));

            assertThat(ex.getErrorType()).isEqualTo(AuctionErrorCode.AUCTION_NOT_READY);
            IT_LOG.info("    [검증] ✔ AUCTION_NOT_READY 예외 확인");
        }
    }

    // ═══ Section 2 : 스트림별 경매 물품 동기화 (syncItem) ════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Section 2 │ ITEM_SYNC — 스트림 경매 목록 조회")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class SyncItemTest {
        @Test
        @Order(1)
        @DisplayName("I-5. 동일 스트림의 경매가 여러 건이면 모두 목록에 담긴다.")
        void syncItem_mixedBottomUpAndUniqueTop() {
            IT_LOG.info("    [요청] 스트림 경매 목록 동기화(syncItem) — 상향식·유일최고가 혼재");
            // given
            Auction bottomUp = saveBottomUpAuction(READY);
            Item uniqueItem = itemRepository.save(TestFixture.createItem("유일최고가 상품"));
            Auction uniqueTop = saveUniqueTopAuction(READY, stream, uniqueItem);

            // when
            ItemSyncResponse response = auctionService.syncItem(stream.getId());

            // then
            assertThat(response.items()).hasSize(2);

            ItemSyncResponse.ItemInfo bottomInfo = response.items().stream()
                    .filter(i -> i.auctionId().equals(bottomUp.getId()))
                    .findFirst()
                    .orElseThrow();
            assertThat(bottomInfo.auctionType()).isEqualTo(BOTTOM_UP);
            assertThat(bottomInfo.startPrice()).isEqualTo(TestFixture.TEST_BOTTOM_UP_START_PRICE);
            assertThat(bottomInfo.bidUnit()).isEqualTo(TestFixture.TEST_BOTTOM_UP_BID_UNIT);
            assertThat(bottomInfo.minPrice()).isNull();
            assertThat(bottomInfo.maxPrice()).isNull();

            ItemSyncResponse.ItemInfo uniqueInfo = response.items().stream()
                    .filter(i -> i.auctionId().equals(uniqueTop.getId()))
                    .findFirst()
                    .orElseThrow();
            assertThat(uniqueInfo.auctionType()).isEqualTo(UNIQUE_TOP);
            assertThat(uniqueInfo.minPrice()).isEqualTo(5_000L);
            assertThat(uniqueInfo.maxPrice()).isEqualTo(500_000L);
            assertThat(uniqueInfo.startPrice()).isNull();
            assertThat(uniqueInfo.bidUnit()).isNull();
            IT_LOG.info("    [검증] ✔ 타입별 필드 매핑 및 목록 2건 확인");
        }
    }

    private Auction saveBottomUpAuction(AuctionStatus status) {
        return saveBottomUpAuction(status, stream, item);
    }

    private Auction saveBottomUpAuction(AuctionStatus status, Stream stream, Item item) {
        BottomUpAuctionDetail detail = TestFixture.createBottomUpAuction(status, stream, item);
        Auction saved = auctionRepository.save(detail.getAuction());
        bottomUpAuctionDetailRepository.save(detail);
        return saved;
    }

    private Auction saveUniqueTopAuction(AuctionStatus status, Stream streamRef, Item itemRef) {
        Auction auction = auctionRepository.save(
                TestFixture.createUniqueTopAuction(status, streamRef, itemRef));

        uniqueBidAuctionDetailRepository.save(
                UniqueBidAuctionDetail.builder()
                        .auction(auction)
                        .minPrice(5_000L)
                        .maxPrice(500_000L)
                        .build());
        return auction;
    }
}