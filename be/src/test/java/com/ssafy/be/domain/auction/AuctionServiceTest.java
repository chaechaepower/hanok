package com.ssafy.be.domain.auction;

import com.ssafy.be.domain.auction.dto.request.AuctionStartRequest;
import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.response.AuctionStartResponse;
import com.ssafy.be.domain.auction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.domain.auction.util.AuctionRedisKeys;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.TestFixture;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.LIVE;
import static com.ssafy.be.domain.auction.entity.AuctionStatus.READY;
import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
class AuctionServiceTest {
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
    private AuctionTimerRepository auctionTimerRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private User sellerUser;

    private Seller seller;

    private Stream stream;

    private Item item;

    private Auction readyAuction;

    private Auction liveAuction;

    @BeforeEach
    void setUp() {
        sellerUser = TestFixture.createTestUser("판매자");
        userRepository.save(sellerUser);

        seller = TestFixture.createSeller(sellerUser);
        sellerRepository.save(seller);

        stream = TestFixture.createStream("테스트 라이브 방송", seller);
        streamRepository.save(stream);

        item = TestFixture.createItem("테스트 상품");
        itemRepository.save(item);

        readyAuction = TestFixture.createAuction(READY, stream, item);
        auctionRepository.save(readyAuction);

        liveAuction = TestFixture.createAuction(LIVE, stream, item);
        auctionRepository.save(liveAuction);
    }

    @AfterEach
    void cleanup() {
        redisTemplate.delete(AuctionRedisKeys.getTimerKey(readyAuction.getId()));
        redisTemplate.delete(AuctionRedisKeys.getTimerKey(liveAuction.getId()));
        redisTemplate.delete(AuctionRedisKeys.getBidKey(readyAuction.getId()));
        redisTemplate.delete(AuctionRedisKeys.getBidKey(liveAuction.getId()));

        auctionRepository.deleteAllInBatch();
        itemRepository.deleteAllInBatch();
        streamRepository.deleteAllInBatch();
        sellerRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @DisplayName("경매를 시작한다.")
    @Test
    void startAuction() {
        // given
        AuctionStartRequest request = AuctionStartRequest.builder()
                .auctionId(readyAuction.getId())
                .build();

        // when
        AuctionStartResponse response = auctionService.startAuction(request, stream.getId(), sellerUser.getId());

        // then
        Auction savedAuction = auctionRepository.findById(readyAuction.getId()).orElseThrow();

        // 경매 시작중인지 확인
        assertThat(savedAuction.getAuctionStatus()).isEqualTo(LIVE);

        // 타이머 설정됐는지 확인
        assertThat(savedAuction.getStartedAt()).isNotNull();

        // 레디스에 타이머 정보 저장됐는지 확인
        assertThat(auctionTimerRepository.existsByAuctionId(readyAuction.getId())).isTrue();

        // response 확인
        AuctionStartResponse.AuctionStartItemDto itemDto = response.item();
        assertThat(itemDto.name()).isEqualTo("테스트 상품");
        assertThat(itemDto.startPrice()).isEqualTo(10000L);
        assertThat(itemDto.bidUnit()).isEqualTo(1000L);

        AuctionStartResponse.AuctionStartTimerDto timerDto = response.timer();
        assertThat(timerDto.durationSeconds()).isEqualTo(60);
        assertThat(timerDto.serverNow()).isNotNull();
        assertThat(timerDto.serverNow()).isEqualTo(timerDto.serverStartedAt());
    }

    @DisplayName("경매중인 상품에 대해 입찰을 한다.")
    @Test
    void placeBid() {
        // given
        User bidder = User.builder()
                .email("bidder@test.com")
                .password("password")
                .nickname("입찰자")
                .phone("010-9999-8888")
                .profileImage("https://storage.googleapis.com/hanok-storage/profiles/default/default-profile.png")
                .isActive(true)
                .balance(50000L) // 충분한 잔액
                .depositedAuctionBalance(0L)
                .depositedWithdrawBalance(0L)
                .notificationSetting(true)
                .build();
        userRepository.save(bidder);

        auctionTimerRepository.save(liveAuction.getId(), item.getAuctionDuration());

        long bidAmount = 15000L;
        BidPlaceRequest request = new BidPlaceRequest(liveAuction.getId(), bidAmount);

        // when
        BidPlaceResponse response = auctionService.placeBid(request, stream.getId(), bidder.getId());

        // then
        BidPlaceResponse.BidInfoDto bidInfo = response.bidInfo();
        assertThat(bidInfo).isNotNull();
        assertThat(bidInfo.nickname()).isEqualTo(bidder.getNickname());
        assertThat(bidInfo.amount()).isEqualTo(bidAmount);
        assertThat(bidInfo.placedAt()).isNotNull();

        // 스나이핑 방지 타이머는 잔여 시간이 충분하므로 null이어야 함
        assertThat(response.snipingTimer()).isNull();
    }
}
