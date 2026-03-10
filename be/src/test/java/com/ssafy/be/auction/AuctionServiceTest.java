package com.ssafy.be.auction;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.LIVE;
import static com.ssafy.be.domain.auction.entity.AuctionStatus.READY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

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

    @DisplayName("경매를 시작한다.")
    @Test
    void startAuction() {
        // given
        User user = TestFixture.createTestUser("테스트 유저");
        userRepository.save(user);

        Seller seller = TestFixture.createSeller(user);
        sellerRepository.save(seller);

        Stream stream = TestFixture.createStream("테스트 라이브 방송", seller);
        streamRepository.save(stream);

        Item item = TestFixture.createItem("테스트 상품");
        itemRepository.save(item);

        Auction auction = TestFixture.createAuction(READY, stream, item);
        auctionRepository.save(auction);

        AuctionStartRequest request = AuctionStartRequest.builder()
                .auctionId(auction.getId())
                .build();

        // when
        AuctionStartResponse response = auctionService.startAuction(request, stream.getId(), user.getId());

        // then
        Auction savedAuction = auctionRepository.findById(auction.getId()).orElseThrow();

        // 경매 시작중인지 확인
        assertThat(savedAuction.getAuctionStatus()).isEqualTo(LIVE);

        // 타이머 설정됐는지 확인
        assertThat(savedAuction.getStartedAt()).isNotNull();

        // 레디스에 타이머 정보 저장됐는지 확인
        assertThat(auctionTimerRepository.existsByAuctionId(auction.getId())).isTrue();

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
}