package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.request.MacroSaveRequest;
import com.ssafy.be.domain.stream.dto.request.StreamListRequest;
import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;
import com.ssafy.be.domain.stream.dto.request.StreamUpdateRequest;
import com.ssafy.be.domain.stream.dto.response.*;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.entity.StreamSortType;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.entity.StreamViewType;
import com.ssafy.be.domain.stream.repository.MacroRedisRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.infra.gcs.GcsClient;
import com.ssafy.be.global.infra.livekit.LiveKitProperties;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("StreamService 도메인 로직 테스트 (Report Style)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class StreamServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks private StreamService streamService;

    @Mock private NotificationService notificationService;
    @Mock private StreamRepository streamRepository;
    @Mock private SellerRepository sellerRepository;
    @Mock private GcsClient gcsClient;
    @Mock private LiveKitProperties liveKitProperties;
    @Mock private StreamViewerService streamViewerService;
    @Mock private AuctionRepository auctionRepository;
    @Mock private ItemRepository itemRepository;
    @Mock private FollowRepository followRepository;
    @Mock private UserRepository userRepository;
    @Mock private StreamPublisher streamPublisher;
    @Mock private com.ssafy.be.domain.bottomupauction.repository.AuctionBidRepository auctionBidRepository;
    @Mock private com.ssafy.be.domain.bottomupauction.repository.BottomUpAuctionDetailRepository bottomUpAuctionDetailRepository;
    @Mock private com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionDetailRepository uniqueBidAuctionDetailRepository;
    @Mock private MacroRedisRepository macroRedisRepository;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       StreamService 비즈니스 로직 테스트 Suite 시작        ║");
        TEST_LOG.info("║  Layer : Service (Unit Test with Mockito)                ║");
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @AfterAll
    static void suiteEnd() {
        long total = System.currentTimeMillis() - SUITE_START;
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║     Suite 종료  |  총 소요: {}ms{}║",
                total, " ".repeat(Math.max(0, 22 - String.valueOf(total).length())));
        TEST_LOG.info("╚══════════════════════════════════════════════════════════╝");
    }

    @Nested @Order(1)
    @DisplayName("Section 1 │ 방송 생명주기 관리 (Register/Start/End/Delete)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StreamLifecycleTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 1 │ Stream Lifecycle");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("L-1. 방송 등록 성공")
        void register_Success() {
            Seller seller = Seller.builder().build();
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            StreamRegisterRequest request = new StreamRegisterRequest("제목", null, null, null, "공지", List.of());
            Stream stream = Stream.builder().title("제목").seller(seller).build();
            ReflectionTestUtils.setField(stream, "id", 100L);
            given(streamRepository.save(any())).willReturn(stream);

            StreamRegisterResponse response = streamService.register(1L, request, null);

            assertThat(response.streamId()).isEqualTo(100L);
            TEST_LOG.info("    [검증] ✔ 방송 등록 및 ID(100) 반환 확인");
        }

        @Test @Order(2)
        @DisplayName("L-2. 방송 시작 시 상태 LIVE로 변경")
        void startStream_Success() {
            Seller seller = Seller.builder().user(User.createUser("a@a.com", "p", "nick", "010")).build();
            Stream stream = Stream.builder().seller(seller).status(StreamStatus.SCHEDULED).build();
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, seller.getId())).willReturn(Optional.of(stream));
            given(followRepository.findBySeller(seller)).willReturn(List.of());

            streamService.startStream(1L, 100L);

            assertThat(stream.getStatus()).isEqualTo(StreamStatus.LIVE);
            TEST_LOG.info("    [검증] ✔ 방송 상태 LIVE 변경 확인");
        }

        @Test @Order(3)
        @DisplayName("L-3. 방송 종료 시 ENDED 상태 및 리소스 정리")
        void endStream_Success() {
            Seller seller = Seller.builder().build();
            Stream stream = Stream.builder().seller(seller).status(StreamStatus.LIVE).build();
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, seller.getId())).willReturn(Optional.of(stream));

            streamService.endStream(1L, 100L);

            assertThat(stream.getStatus()).isEqualTo(StreamStatus.ENDED);
            verify(streamViewerService).clearViewers(100L);
            TEST_LOG.info("    [검증] ✔ 방송 상태 ENDED 변경 및 시청자 목록 정리 확인");
        }

        @Test @Order(4)
        @DisplayName("L-4. 방송 삭제 시 연관 데이터 정리")
        void deleteStream_Success() {
            Seller seller = Seller.builder().build();
            Stream stream = Stream.builder().seller(seller).status(StreamStatus.SCHEDULED).build();
            ReflectionTestUtils.setField(stream, "thumbnail", "thumb.jpg");
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, seller.getId())).willReturn(Optional.of(stream));

            streamService.deleteStream(1L, 100L);

            verify(gcsClient).deleteImage("thumb.jpg");
            verify(auctionRepository).deleteByStreamId(100L);
            verify(streamRepository).delete(stream);
            TEST_LOG.info("    [검증] ✔ 썸네일/경매/방송 데이터 삭제 확인");
        }
    }

    @Nested @Order(2)
    @DisplayName("Section 2 │ 방송 정보 조회 및 입장 (Get/List/Enter)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StreamQueryTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 2 │ Stream Query & Entry");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("Q-1. 방송 상세 조회")
        void getStream_Success() {
            Stream stream = Stream.builder().title("제목").status(StreamStatus.LIVE).build();
            ReflectionTestUtils.setField(stream, "id", 100L);
            given(streamRepository.findById(100L)).willReturn(Optional.of(stream));
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of());

            StreamDetailResponse response = streamService.getStream(1L, 100L);

            assertThat(response.streamId()).isEqualTo(100L);
            TEST_LOG.info("    [검증] ✔ 상세 정보(ID:100) 정상 조회 확인");
        }

        @Test @Order(2)
        @DisplayName("Q-2. 시청자수 순 정렬 방송 목록 조회")
        void getStreamList_ViewerCountSort() {
            Stream s1 = Stream.builder().seller(Seller.builder().user(User.createUser("a@a.com","p","n1","0")).build()).build();
            Stream s2 = Stream.builder().seller(Seller.builder().user(User.createUser("b@b.com","p","n2","0")).build()).build();
            ReflectionTestUtils.setField(s1, "id", 1L); ReflectionTestUtils.setField(s2, "id", 2L);
            given(streamRepository.findAllLiveStreams(null)).willReturn(List.of(s1, s2));
            given(streamViewerService.getViewerCount(1L)).willReturn(10L);
            given(streamViewerService.getViewerCount(2L)).willReturn(20L);

            StreamListRequest request = new StreamListRequest(StreamViewType.ALL, null, StreamStatus.LIVE, StreamSortType.VIEWER_COUNT, 0, 10);
            Page<StreamListItemResponse> result = streamService.getStreamList(request);

            assertThat(result.getContent().get(0).streamId()).isEqualTo(2L);
            TEST_LOG.info("    [검증] ✔ 시청자 많은 수(20명)가 1위로 반환 확인");
        }

        @Test @Order(3)
        @DisplayName("Q-3. 방송 입장 시 LiveKit 토큰 발급")
        void enterStream_Success() {
            User user = User.createUser("h@t.com", "pw", "h", "0"); ReflectionTestUtils.setField(user, "id", 1L);
            Stream stream = Stream.builder().seller(Seller.builder().user(user).build()).status(StreamStatus.LIVE).build();
            ReflectionTestUtils.setField(stream, "id", 100L);
            given(streamRepository.findById(100L)).willReturn(Optional.of(stream));
            given(streamViewerService.enter(100L, 1L)).willReturn("id_1");
            given(liveKitProperties.apiKey()).willReturn("k"); given(liveKitProperties.apiSecret()).willReturn("s");
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of());

            StreamEnterResponse response = streamService.enterStream(1L, 100L);

            assertThat(response.token()).isNotNull();
            assertThat(response.isHost()).isTrue();
            TEST_LOG.info("    [검증] ✔ LiveKit JWT 토큰 및 호스트 여부 확인");
        }
    }

    @Nested @Order(3)
    @DisplayName("Section 3 │ 방송 설정 수정 및 동기화 (Update/Sync)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StreamUpdateTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 3 │ Stream Update & Sync");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("U-1. 예약 방송의 경매 정보 동기화 (추가/삭제/상태복구)")
        void updateStream_SyncAuctionItems_Success() {
            Seller seller = Seller.builder().build();
            Stream stream = Stream.builder().seller(seller).status(StreamStatus.SCHEDULED).build();
            ReflectionTestUtils.setField(stream, "id", 100L);
            Item item1 = Item.builder().status(ItemStatus.SCHEDULED).build();
            Item item2 = Item.builder().status(ItemStatus.SCHEDULED).build();
            Item item3 = Item.builder().status(ItemStatus.READY).build();
            ReflectionTestUtils.setField(item1, "id", 1L); ReflectionTestUtils.setField(item2, "id", 2L); ReflectionTestUtils.setField(item3, "id", 3L);
            Auction auction1 = Auction.builder().item(item1).auctionStatus(AuctionStatus.READY).build();
            Auction auction2 = Auction.builder().item(item2).auctionStatus(AuctionStatus.READY).build();
            
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, seller.getId())).willReturn(Optional.of(stream));
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of(auction1, auction2));
            given(itemRepository.findByIdAndSellerId(1L, seller.getId())).willReturn(Optional.of(item1));
            given(itemRepository.findByIdAndSellerId(3L, seller.getId())).willReturn(Optional.of(item3));

            StreamUpdateRequest req = new StreamUpdateRequest("제목", null, null, null, "공지", List.of(
                    new StreamRegisterRequest.AuctionItemRequest(1L, AuctionType.BOTTOM_UP, 60, new StreamRegisterRequest.BottomUpAuctionDetailRequest(1000L, 100L), null),
                    new StreamRegisterRequest.AuctionItemRequest(3L, AuctionType.UNIQUE_TOP, 60, null, new StreamRegisterRequest.UniqueBidAuctionDetailRequest(1000L, 5000L))
            ));

            streamService.updateStream(1L, 100L, req, null);

            verify(auctionRepository).delete(auction2);
            assertThat(item2.getStatus()).isEqualTo(ItemStatus.READY);
            verify(auctionRepository).save(any(Auction.class));
            TEST_LOG.info("    [검증] ✔ 2번 아이템 삭제 및 READY 복구, 3번 아이템 신규 추가 확인");
        }
    }

    @Nested @Order(4)
    @DisplayName("Section 4 │ 기타 보충 기능 (Macros)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StreamExtraTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 4 │ Extra Functions (Macros)");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("E-1. Redis 연동 매크로 저장/조회")
        void macros_Success() {
            Seller seller = Seller.builder().build();
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, seller.getId())).willReturn(Optional.of(Stream.builder().build()));
            given(streamRepository.findById(100L)).willReturn(Optional.of(Stream.builder().build()));
            given(macroRedisRepository.findAll(100L)).willReturn(java.util.Collections.emptyMap());

            streamService.saveMacros(1L, 100L, new MacroSaveRequest(List.of(new MacroSaveRequest.MacroItem("Q", "A"))));
            streamService.getMacros(100L, null);

            verify(macroRedisRepository).saveAll(eq(100L), any());
            verify(macroRedisRepository).findAll(100L);
            TEST_LOG.info("    [검증] ✔ Redis 입출력(save/findAll) 위임 확인");
        }
    }
}
