package com.ssafy.be.domain.uniqueauction;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.uniqueaction.dto.model.UniqueAuctionResult;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidStartResponse;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidSyncResponse;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuction;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidStatus;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionRepository;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidRepository;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.global.websocket.exception.StompException;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.*;

@IntegrationTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UniqueBidAuctionServiceTest {

    @Autowired private UniqueBidAuctionService uniqueBidAuctionService;
    @Autowired private UniqueBidAuctionRepository uniqueBidAuctionRepository;
    @Autowired private UniqueBidRepository uniqueBidRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private StreamRepository streamRepository;
    @Autowired private ItemRepository itemRepository;
    @Autowired private AuctionRepository auctionRepository;
    @Autowired private ShippingAddressRepository shippingAddressRepository;
    @Autowired private StringRedisTemplate redisTemplate;

    private User sellerUser;
    private User bidder1;
    private User bidder2;
    private User bidder3;
    private Auction auction;
    private UniqueBidAuction uniqueBidAuction;

    @MockitoBean
    private BiznoClient biznoClient;

    @MockitoBean private PortoneClient portoneClient;

    @BeforeEach
    void setUp() {
        sellerUser = TestFixture.createTestUser("판매자");
        userRepository.save(sellerUser);

        Seller seller = TestFixture.createSeller(sellerUser);
        sellerRepository.save(seller);

        Stream stream = TestFixture.createStream("테스트 방송", seller);
        streamRepository.save(stream);

        Item item = TestFixture.createItem("테스트 상품");
        itemRepository.save(item);

        auction = TestFixture.createAuction(AuctionStatus.INTRODUCING, stream, item);
        auctionRepository.save(auction);

        uniqueBidAuction = UniqueBidAuction.builder()
                .auction(auction)
                .minPrice(10000L)
                .maxPrice(100000L)
                .build();
        uniqueBidAuctionRepository.save(uniqueBidAuction);

        bidder1 = createBidder("bidder1@test.com", "입찰자1", 200000L);
        bidder2 = createBidder("bidder2@test.com", "입찰자2", 200000L);
        bidder3 = createBidder("bidder3@test.com", "입찰자3", 200000L);

        ShippingAddress shipping = ShippingAddress.builder()
                .user(bidder1)
                .recipientName("홍길동")
                .addressName("집")
                .postalCode(12345)
                .address("서울시 강남구")
                .addressDetail("101호")
                .phone("010-1234-5678")
                .isDefault(true)
                .build();
        shippingAddressRepository.save(shipping);
    }

    @AfterEach
    void cleanup() {
        redisTemplate.delete("unique:bids:" + auction.getId());
        redisTemplate.delete("unique:counts:" + auction.getId());

        shippingAddressRepository.deleteAllInBatch();
        uniqueBidAuctionRepository.deleteAllInBatch();
        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    // ──────────────────────────────────────────────
    // 1. introduceItem
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("1-1. 판매자가 introduceItem 호출 시 INTRODUCING 상태로 전환")
    void introduceItem_success() {
        uniqueBidAuctionService.introduceItem(auction.getId(), sellerUser.getId());

        UniqueBidAuction result = uniqueBidAuctionRepository.findByAuction_Id(auction.getId()).orElseThrow();
        assertThat(result.getStatus()).isEqualTo(UniqueBidStatus.INTRODUCING);
    }

    @Test
    @DisplayName("1-2. 판매자가 아닌 유저가 introduceItem 호출 시 예외")
    void introduceItem_unauthorized() {
        assertThatThrownBy(() ->
                uniqueBidAuctionService.introduceItem(auction.getId(), bidder1.getId())
        ).isInstanceOf(StompException.class);
    }

    @Test
    @DisplayName("1-3. READY가 아닌 상태에서 introduceItem 호출 시 예외")
    void introduceItem_invalidStatus() {
        uniqueBidAuctionService.introduceItem(auction.getId(), sellerUser.getId()); // READY → INTRODUCING

        assertThatThrownBy(() ->
                uniqueBidAuctionService.introduceItem(auction.getId(), sellerUser.getId())
        ).isInstanceOf(StompException.class);
    }

    // ──────────────────────────────────────────────
    // 2. startAuction
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("2-1. 경매 시작 시 LIVE 상태 전환 및 응답 검증")
    void startAuction_success() {
        uniqueBidAuctionService.introduceItem(auction.getId(), sellerUser.getId());

        UniqueBidStartRequest request = new UniqueBidStartRequest(auction.getId());
        UniqueBidStartResponse response = uniqueBidAuctionService.startAuction(request, sellerUser.getId());

        UniqueBidAuction result = uniqueBidAuctionRepository.findByAuction_Id(auction.getId()).orElseThrow();
        assertThat(result.getStatus()).isEqualTo(UniqueBidStatus.LIVE);
        assertThat(result.getStartedAt()).isNotNull();

        assertThat(response.minPrice()).isEqualTo(10000L);
        assertThat(response.maxPrice()).isEqualTo(100000L);
        assertThat(response.serverNow()).isNotNull();
        assertThat(response.serverStartedAt()).isEqualTo(result.getStartedAt());
    }

    @Test
    @DisplayName("2-2. INTRODUCING 상태 아닐 때 startAuction 호출 시 예외")
    void startAuction_invalidStatus() {
        // READY 상태에서 바로 start 시도
        UniqueBidStartRequest request = new UniqueBidStartRequest(auction.getId());

        assertThatThrownBy(() ->
                uniqueBidAuctionService.startAuction(request, sellerUser.getId())
        ).isInstanceOf(StompException.class);
    }

    // ──────────────────────────────────────────────
    // 3. placeBid
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("3-1. 정상 입찰 시 참가자 수 증가")
    void placeBid_success() {
        startLive();

        UniqueBidPlaceRequest request = new UniqueBidPlaceRequest(auction.getId(), 35000L);
        long count = uniqueBidAuctionService.placeBid(request, bidder1.getId());

        assertThat(count).isEqualTo(1L);
        assertThat(uniqueBidRepository.existsBid(auction.getId(), bidder1.getId())).isTrue();
    }

    @Test
    @DisplayName("3-2. 중복 입찰 시 ALREADY_BID 예외")
    void placeBid_duplicate() {
        startLive();

        UniqueBidPlaceRequest request = new UniqueBidPlaceRequest(auction.getId(), 35000L);
        uniqueBidAuctionService.placeBid(request, bidder1.getId());

        assertThatThrownBy(() ->
                uniqueBidAuctionService.placeBid(request, bidder1.getId())
        ).isInstanceOf(StompException.class);
    }

    @Test
    @DisplayName("3-3. 판매자 자기 상품 입찰 시 SELF_BID 예외")
    void placeBid_selfBid() {
        startLive();

        UniqueBidPlaceRequest request = new UniqueBidPlaceRequest(auction.getId(), 35000L);

        assertThatThrownBy(() ->
                uniqueBidAuctionService.placeBid(request, sellerUser.getId())
        ).isInstanceOf(StompException.class);
    }

    @Test
    @DisplayName("3-4. 범위 밖 금액 입찰 시 INVALID_AMOUNT 예외")
    void placeBid_invalidAmount() {
        startLive();

        UniqueBidPlaceRequest overMax = new UniqueBidPlaceRequest(auction.getId(), 200000L);
        UniqueBidPlaceRequest underMin = new UniqueBidPlaceRequest(auction.getId(), 5000L);

        assertThatThrownBy(() ->
                uniqueBidAuctionService.placeBid(overMax, bidder1.getId())
        ).isInstanceOf(StompException.class);

        assertThatThrownBy(() ->
                uniqueBidAuctionService.placeBid(underMin, bidder1.getId())
        ).isInstanceOf(StompException.class);
    }

    @Test
    @DisplayName("3-5. 단위에 맞지 않는 금액 입찰 시 INVALID_AMOUNT 예외")
    void placeBid_invalidUnit() {
        startLive();

        // bidUnit이 1000원이면 35500은 불가
        UniqueBidPlaceRequest request = new UniqueBidPlaceRequest(auction.getId(), 35500L);

        assertThatThrownBy(() ->
                uniqueBidAuctionService.placeBid(request, bidder1.getId())
        ).isInstanceOf(StompException.class);
    }

    // ──────────────────────────────────────────────
    // 4. aggregate - 낙찰
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("4-1. 유일 최고가 존재 시 낙찰 처리")
    void aggregate_won() {
        startLive();

        // bidder1: 50000 (유일), bidder2: 35000 (유일), bidder3: 35000 (중복)
        placeBid(bidder1, 50000L);
        placeBid(bidder2, 35000L);
        placeBid(bidder3, 35000L);

        UniqueBidCalculateRequest request = new UniqueBidCalculateRequest(auction.getId());
        UniqueAuctionResult result = uniqueBidAuctionService.aggregate(request);

        assertThat(result.isWon()).isTrue();
        assertThat(result.winnerId()).isEqualTo(bidder1.getId());
        assertThat(result.winnerPrice()).isEqualTo(50000L);
        assertThat(result.shippingAddress()).isNotNull();

        UniqueBidAuction saved = uniqueBidAuctionRepository.findByAuction_Id(auction.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(UniqueBidStatus.SOLD);

        // Redis 정리 확인
        assertThat(uniqueBidRepository.countParticipants(auction.getId())).isZero();
    }

    @Test
    @DisplayName("4-2. 유일 최고가 없으면 유찰 처리")
    void aggregate_unsold() {
        startLive();

        // bidder1, bidder2 모두 같은 금액 → 유일 최고가 없음
        placeBid(bidder1, 50000L);
        placeBid(bidder2, 50000L);

        UniqueBidCalculateRequest request = new UniqueBidCalculateRequest(auction.getId());
        UniqueAuctionResult result = uniqueBidAuctionService.aggregate(request);

        assertThat(result.isWon()).isFalse();
        assertThat(result.winnerId()).isNull();
        assertThat(result.topDuplicates()).isNotEmpty();

        UniqueBidAuction saved = uniqueBidAuctionRepository.findByAuction_Id(auction.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(UniqueBidStatus.UNSOLD);
    }

    @Test
    @DisplayName("4-3. 낙찰 시 낙찰자 잔액 에스크로 이동, 나머지 환불")
    void aggregate_won_balanceVerification() {
        startLive();

        long bidder1Amount = 50000L;
        long bidder2Amount = 35000L;

        placeBid(bidder1, bidder1Amount);
        placeBid(bidder2, bidder2Amount);

        long bidder1BalanceBefore = userRepository.findById(bidder1.getId()).orElseThrow().getBalance();
        long bidder2BalanceBefore = userRepository.findById(bidder2.getId()).orElseThrow().getBalance();

        UniqueBidCalculateRequest request = new UniqueBidCalculateRequest(auction.getId());
        uniqueBidAuctionService.aggregate(request);

        User winner = userRepository.findById(bidder1.getId()).orElseThrow();
        User loser  = userRepository.findById(bidder2.getId()).orElseThrow();

        // 낙찰자: 에스크로 증가
        assertThat(winner.getDepositedEscrowBalance()).isEqualTo(bidder1Amount);
        // 패자: 환불 (잔액 복구)
        assertThat(loser.getBalance()).isEqualTo(bidder2BalanceBefore + bidder2Amount);
    }

    // ──────────────────────────────────────────────
    // 5. syncAuction
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("5-1. LIVE 상태에서 sync 호출 시 정상 응답")
    void syncAuction_success() {
        startLive();
        placeBid(bidder1, 50000L);

        Long streamId = auction.getStream().getId();
        UniqueBidSyncResponse response = uniqueBidAuctionService.syncAuction(streamId, bidder1.getId());

        assertThat(response.minPrice()).isEqualTo(10000L);
        assertThat(response.maxPrice()).isEqualTo(100000L);
        assertThat(response.participantCount()).isEqualTo(1L);
        assertThat(response.hasBid()).isTrue();
        assertThat(response.serverNow()).isNotNull();
    }

    @Test
    @DisplayName("5-2. 입찰 안 한 유저 sync 시 hasBid = false")
    void syncAuction_hasBid_false() {
        startLive();
        placeBid(bidder1, 50000L);

        Long streamId = auction.getStream().getId();
        UniqueBidSyncResponse response = uniqueBidAuctionService.syncAuction(streamId, bidder2.getId());

        assertThat(response.hasBid()).isFalse();
    }

    @Test
    @DisplayName("5-3. LIVE 아닌 상태에서 sync 호출 시 예외")
    void syncAuction_notLive() {
        Long streamId = auction.getStream().getId();

        assertThatThrownBy(() ->
                uniqueBidAuctionService.syncAuction(streamId, bidder1.getId())
        ).isInstanceOf(StompException.class);
    }

    // ──────────────────────────────────────────────
    // 헬퍼
    // ──────────────────────────────────────────────

    private void startLive() {
        uniqueBidAuctionService.introduceItem(auction.getId(), sellerUser.getId());
        uniqueBidAuctionService.startAuction(
                new UniqueBidStartRequest(auction.getId()), sellerUser.getId());
    }

    private void placeBid(User bidder, Long amount) {
        uniqueBidAuctionService.placeBid(
                new UniqueBidPlaceRequest(auction.getId(), amount), bidder.getId());
    }

    private User createBidder(String email, String nickname, Long balance) {
        User user = User.builder()
                .email(email)
                .password("password")
                .nickname(nickname)
                .phone("010-0000-0000")
                .profileImage("https://storage.googleapis.com/hanok-storage/profiles/default/default-profile.png")
                .isActive(true)
                .balance(balance)
                .depositedEscrowBalance(0L)
                .depositedWithdrawBalance(0L)
                .depositedBidBalance(0L)
                .notificationSetting(true)
                .build();
        return userRepository.save(user);
    }
}
