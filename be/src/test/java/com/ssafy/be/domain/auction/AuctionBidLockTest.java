package com.ssafy.be.domain.auction;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.bottomupauction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.bottomupauction.service.AuctionBidService;
import com.ssafy.be.domain.bottomupauction.service.BottomUpAuctionService;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.bottomupauction.repository.AuctionBidRepository;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
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
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.LIVE;
import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
@DisplayName("BottomUpAuction Lock 통합 테스트 (Smoke + Step-up)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
public class AuctionBidLockTest {

    private static final Logger IT_LOG = LoggerFactory.getLogger("IT_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    public static final int NUMBER_OF_THREADS = 1000;
    private static final long BIDDER_BALANCE = 100000L;

    @Autowired
    private BottomUpAuctionService bottomUpAuctionService;
    @Autowired
    private AuctionBidService auctionBidService; // 락 없는 순수 테스트용
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
    private AuctionTimerRepository auctionTimerRepository;
    @Autowired
    private AuctionBidRepository auctionBidRepository;
    @Autowired
    private StringRedisTemplate redisTemplate;

    private Auction liveAuction;
    private List<User> bidders;
    private User sellerUser;
    private Seller seller;
    private Stream stream;
    private Item item;

    @BeforeAll
    static void suiteStart() {
        IT_LOG.info("");
        IT_LOG.info("╔════════════════════════════════════════════════════════════╗");
        IT_LOG.info("║          Auction Bid Lock 통합 테스트 Suite 시작           ║");
        IT_LOG.info("║  Layer  : Service → Redis Lock (Redisson)                  ║");
        IT_LOG.info("║  시나리오: 동시성 처리가 강력한 분산 락 검증               ║");
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
        bidders = userRepository.saveAll(
                TestFixture.createUsers(NUMBER_OF_THREADS).stream()
                        .map(user -> user.toBuilder().balance(BIDDER_BALANCE).depositedBidBalance(0L).build())
                        .toList());
        sellerUser = userRepository.save(TestFixture.createUser("판매자"));
        seller = sellerRepository.save(TestFixture.createSeller(sellerUser));
        stream = streamRepository.save(TestFixture.createStream("테스트 라이브 방송", seller));
        item = itemRepository.save(TestFixture.createItem("테스트 상품"));

        liveAuction = auctionRepository.save(TestFixture.createAuction(LIVE, stream, item));

        BottomUpAuctionDetail detail = TestFixture.createBottomUpAuctionDetail(liveAuction, item);
        bottomUpAuctionDetailRepository.save(detail);

        auctionTimerRepository.save(liveAuction.getId(), liveAuction.getAuctionDuration());
    }

    @AfterEach
    void tearDown() {
        if (liveAuction != null) {
            Long auctionId = liveAuction.getId();
            redisTemplate.delete(AuctionRedisKeys.getTimerKey(auctionId));
            redisTemplate.delete(AuctionRedisKeys.getBidKey(auctionId));
            redisTemplate.delete(AuctionRedisKeys.getLockKey(auctionId));
        }
        bottomUpAuctionDetailRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Nested
    @Order(1)
    @DisplayName("Section 1 │ 동시성 제어 락 검증")
    @ExtendWith(IntegrationTestExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class BidLockTest {

        @Test
        @Order(1)
        @DisplayName("I-1. 락 적용 시, 1000명이 같은 가격으로 동시 입찰하면 단 1명만 성공해야 한다.")
        void onlyOneSucceeds_withLock() throws InterruptedException {
            IT_LOG.info("    [요청] 1000명의 동시 입찰 요청 발생 (Lock 적용)");

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest bidPlaceRequest = BidPlaceRequest.builder()
                    .auctionId(liveAuction.getId()).amount(bidAmount).build();

            ExecutorService executorService = Executors.newFixedThreadPool(32);
            CountDownLatch latch = new CountDownLatch(NUMBER_OF_THREADS);

            long startTime = System.currentTimeMillis();

            for (User bidder : bidders) {
                executorService.submit(() -> {
                    try {
                        // 정상적인 실제 비즈니스 흐름 (Facade Lock 포함됨)
                        bottomUpAuctionService.placeBid(bidPlaceRequest, stream.getId(), bidder.getId());
                    } catch (Exception e) {
                        // 중복 입찰 등 충돌 무시 (원하는 효과)
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await();
            executorService.shutdown();
            long executionTime = System.currentTimeMillis() - startTime;

            List<Bid> bids = auctionBidRepository.findAll(liveAuction.getId());

            IT_LOG.info("    [검증] 실행 시간: {}ms, DB 저장된 참가자 수: {}", executionTime, bids.size());
            assertThat(bids.size()).isEqualTo(1);
            assertThat(bids.getFirst().amount()).isEqualTo(bidAmount);
            IT_LOG.info("    [검증] ✔ 분산 락 덕분에 확실한 동시성 방어 및 순차적 처리 성공!");
        }

        @Test
        @Order(2)
        @DisplayName("I-2. 락 미적용 시, 중복 입찰이 다수 발생하게 된다.")
        void multipleSucceed_noLock() throws InterruptedException {
            IT_LOG.info("    [요청] 1000명의 동시 입찰 요청 발생 (Lock 미적용 순수 저장 로직 호출)");

            long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;
            BidPlaceRequest bidPlaceRequest = BidPlaceRequest.builder()
                    .auctionId(liveAuction.getId()).amount(bidAmount).build();

            ExecutorService executorService = Executors.newFixedThreadPool(32);
            CountDownLatch latch = new CountDownLatch(NUMBER_OF_THREADS);

            long startTime = System.currentTimeMillis();

            for (User bidder : bidders) {
                executorService.submit(() -> {
                    try {
                        // Facade Lock을 거치지 않는 내부 순수 DB/Redis 인서트 로직을 직접 타기
                        auctionBidService.saveBid(bidPlaceRequest, liveAuction, bidder);
                    } catch (Exception e) {
                        // 무결성 에러 무시
                    } finally {
                        latch.countDown();
                    }
                });
            }

            latch.await();
            executorService.shutdown();
            long executionTime = System.currentTimeMillis() - startTime;

            List<Bid> bids = auctionBidRepository.findAll(liveAuction.getId());

            IT_LOG.info("    [검증] 실행 시간: {}ms, DB 저장된 참가자 수: {}", executionTime, bids.size());
            assertThat(bids.size()).isNotEqualTo(1);
            assertThat(bids.getFirst().amount()).isEqualTo(bidAmount);
            IT_LOG.info("    [검증] ✔ 락을 생략할 경우 여실히 드러나는 다중 입찰 오동작 증명!");
        }
    }
}
