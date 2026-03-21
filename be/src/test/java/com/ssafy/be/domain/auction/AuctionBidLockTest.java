package com.ssafy.be.domain.auction;

import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.auction.repository.AuctionBidRepository;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.support.annotation.IntegrationTest;
import com.ssafy.be.support.util.ConcurrentTestUtil;
import com.ssafy.be.support.util.TestFixture;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.LIVE;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@IntegrationTest
public class AuctionBidLockTest {
    public static final int NUMBER_OF_THREADS = 1000;
    private static final long BIDDER_BALANCE = 100000L;

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
    private BottomUpAuctionDetailRepository bottomUpAuctionDetailRepository;
    @Autowired
    private AuctionTimerRepository auctionTimerRepository;
    @Autowired
    private AuctionBidRepository auctionBidRepository;

    private Auction liveAuction;
    private List<User> bidders;
    private User sellerUser;
    private Seller seller;
    private Stream stream;
    private Item item;

    @BeforeEach
    void setUp() {
        bidders = userRepository.saveAll(
                TestFixture.createUsers(NUMBER_OF_THREADS).stream()
                        .map(user -> user.toBuilder()
                                .balance(BIDDER_BALANCE)
                                .build()
                        ).toList()
        );

        sellerUser = userRepository.save(
                TestFixture.createUser("판매자")
        );

        seller = sellerRepository.save(
                TestFixture.createSeller(sellerUser)
        );

        stream = streamRepository.save(
                TestFixture.createStream("테스트 라이브 방송", seller)
        );

        item = itemRepository.save(
                TestFixture.createItem("테스트 상품")
        );

        liveAuction = auctionRepository.save(
                TestFixture.createAuction(LIVE, stream, item)
        );
        BottomUpAuctionDetail detail = TestFixture.createBottomUpAuctionDetail(liveAuction, item);
        bottomUpAuctionDetailRepository.save(detail);

        auctionTimerRepository.save(liveAuction.getId(), liveAuction.getAuctionDuration());
    }

    // ======================== 락 적용 ========================

    @Test
    @DisplayName("#1. 락 적용 시, 1000명이 같은 가격으로 동시 입찰하는 경우 1명만 입찰된다.")
    void onlyOneSucceeds_whenSamePriceConcurrentBids_withLock() throws InterruptedException {
        // given
        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;

        BidPlaceRequest bidPlaceRequest = BidPlaceRequest.builder()
                .auctionId(liveAuction.getId())
                .amount(bidAmount)
                .build();

        // when
        long startTime = System.currentTimeMillis();

        ConcurrentTestUtil.executeConcurrentBids(
                bidPlaceRequest,
                stream.getId(),
                bidders,
                (request, streamId, userId) -> auctionService.placeBidWithLock(request, streamId, userId)
        );

        long executionTime = System.currentTimeMillis() - startTime;

        // then
        log.info("실행 시간: {}ms", executionTime);

        List<Bid> bids = auctionBidRepository.findAll(liveAuction.getId());

        log.info("DB에 저장된 참가자 수: {}", bids.size());

        assertThat(bids.size()).isEqualTo(1);
        assertThat(bids.getFirst().amount()).isEqualTo(bidAmount);
    }

    // ======================== 락 미적용 ========================

    @Test
    @DisplayName("#1. 락 미적용 시, 1000명이 같은 가격으로 동시 입찰하는 경우 여러 명이 중복 입찰된다.")
    void multipleSucceed_whenSamePriceConcurrentBids_noLock() throws InterruptedException {
        // given
        long bidAmount = TestFixture.TEST_BOTTOM_UP_START_PRICE + TestFixture.TEST_BOTTOM_UP_BID_UNIT;

        BidPlaceRequest bidPlaceRequest = BidPlaceRequest.builder()
                .auctionId(liveAuction.getId())
                .amount(bidAmount)
                .build();

        // when
        long startTime = System.currentTimeMillis();

        ConcurrentTestUtil.executeConcurrentBids(
                bidPlaceRequest,
                stream.getId(),
                bidders,
                (request, streamId, userId) -> auctionService.placeBidWithoutLock(request, streamId, userId)
        );

        long executionTime = System.currentTimeMillis() - startTime;

        // then
        log.info("실행 시간: {}ms", executionTime);

        List<Bid> bids = auctionBidRepository.findAll(liveAuction.getId());

        log.info("DB에 저장된 참가자 수: {}", bids.size());

        assertThat(bids.size()).isNotEqualTo(1);
        assertThat(bids.getFirst().amount()).isEqualTo(bidAmount);
    }
}
