package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemCondition;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.notification.model.NotificationType;
import com.ssafy.be.domain.notification.service.NotificationService;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.support.util.TestFixture;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
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
import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.gcs.GcsClient;
import com.ssafy.be.global.infra.livekit.LiveKitProperties;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
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
            Seller seller = TestFixture.createSeller(User.createUser("reg@r.com", "p", "s", "010"));
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            StreamRegisterRequest request = new StreamRegisterRequest("제목", null, null, null, "공지", List.of());
            Stream stream = TestFixture.spyStreamWithId(Stream.builder().title("제목").seller(seller).build(), 100L);
            given(streamRepository.save(any())).willReturn(stream);

            StreamRegisterResponse response = streamService.register(1L, request, null);

            assertThat(response.streamId()).isEqualTo(100L);
            TEST_LOG.info("    [검증] ✔ 방송 등록 및 ID(100) 반환 확인");
        }

        @Test @Order(2)
        @DisplayName("L-2. 방송 시작 시 상태 LIVE로 변경")
        void startStream_Success() {
            User host = User.createUser("a@a.com", "p", "nick", "010").toBuilder().id(1L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(host), 5L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.SCHEDULED).build(), 100L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 5L)).willReturn(Optional.of(stream));
            given(followRepository.findBySeller(seller)).willReturn(List.of());

            streamService.startStream(1L, 100L);

            assertThat(stream.getStatus()).isEqualTo(StreamStatus.LIVE);
            TEST_LOG.info("    [검증] ✔ 방송 상태 LIVE 변경 확인");
        }

        @Test @Order(3)
        @DisplayName("L-3. 방송 종료 시 ENDED 상태 및 리소스 정리")
        void endStream_Success() {
            User u = User.createUser("e@e.com", "p", "e", "010").toBuilder().id(2L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 3L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.LIVE).build(), 100L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 3L)).willReturn(Optional.of(stream));

            streamService.endStream(1L, 100L);

            assertThat(stream.getStatus()).isEqualTo(StreamStatus.ENDED);
            verify(streamViewerService).clearViewers(100L);
            verify(itemRepository).updateScheduledItemsToReadyByStreamId(
                    100L, ItemStatus.SCHEDULED, ItemStatus.READY);
            verify(streamPublisher).broadcast(100L, StreamEventType.SYSTEM_STREAM_END, null);
            TEST_LOG.info("    [검증] ✔ ENDED·시청자 정리·예약물품 READY·종료 이벤트");
        }

        @Test @Order(4)
        @DisplayName("L-4. 방송 삭제 시 연관 데이터 정리")
        void deleteStream_Success() {
            User u = User.createUser("d@d.com", "p", "d", "010").toBuilder().id(2L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 4L);
            Stream stream = TestFixture.spyStreamWithId(Stream.builder()
                    .thumbnail("thumb.jpg")
                    .seller(seller)
                    .status(StreamStatus.SCHEDULED)
                    .build(), 100L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 4L)).willReturn(Optional.of(stream));

            streamService.deleteStream(1L, 100L);

            verify(gcsClient).deleteImage("thumb.jpg");
            verify(auctionRepository).deleteByStreamId(100L);
            verify(streamRepository).delete(stream);
            TEST_LOG.info("    [검증] ✔ 썸네일/경매/방송 데이터 삭제 확인");
        }

        @Test @Order(5)
        @DisplayName("L-5. 등록 시 판매자 없으면 SELLER_NOT_FOUND")
        void register_whenSellerMissing_throws() {
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.empty());
            StreamRegisterRequest request = new StreamRegisterRequest("제목", null, null, null, "공지", List.of());

            assertThatThrownBy(() -> streamService.register(1L, request, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ SELLER_NOT_FOUND");
        }

        @Test @Order(6)
        @DisplayName("L-6. 예약이 아닌 방송은 삭제 불가 (STREAM_CANNOT_DELETE)")
        void deleteStream_whenNotScheduled_throws() {
            User u = User.createUser("x@x.com", "p", "x", "010").toBuilder().id(2L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 9L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.LIVE).build(), 100L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 9L)).willReturn(Optional.of(stream));

            assertThatThrownBy(() -> streamService.deleteStream(1L, 100L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(StreamErrorCode.STREAM_CANNOT_DELETE));
            TEST_LOG.info("    [검증] ✔ STREAM_CANNOT_DELETE");
        }

        @Test @Order(7)
        @DisplayName("L-7. 방송 시작 시 팔로워에게 알림 발송")
        void startStream_notifiesFollowers() {
            User host = User.createUser("h@h.com", "p", "판매자", "010").toBuilder().id(1L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(host), 10L);
            User followerUser = User.createUser("f@f.com", "p", "팔로워", "010").toBuilder().id(90L).build();
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.SCHEDULED).build(), 100L);
            Follow follow = Follow.builder().user(followerUser).seller(seller).build();

            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 10L)).willReturn(Optional.of(stream));
            given(followRepository.findBySeller(seller)).willReturn(List.of(follow));

            streamService.startStream(1L, 100L);

            verify(notificationService).sendNotification(
                    eq(90L),
                    eq(NotificationType.STREAM_START.name()),
                    eq(NotificationType.STREAM_START.getTitle()),
                    any(),
                    eq("/live/100"));
            TEST_LOG.info("    [검증] ✔ 팔로워 알림");
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
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().title("제목").status(StreamStatus.LIVE).build(), 100L);
            given(streamRepository.findById(100L)).willReturn(Optional.of(stream));
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of());

            StreamDetailResponse response = streamService.getStream(1L, 100L);

            assertThat(response.streamId()).isEqualTo(100L);
            TEST_LOG.info("    [검증] ✔ 상세 정보(ID:100) 정상 조회 확인");
        }

        @Test @Order(2)
        @DisplayName("Q-2. 시청자수 순 정렬 방송 목록 조회")
        void getStreamList_ViewerCountSort() {
            User u1 = User.createUser("a@a.com", "p", "n1", "0").toBuilder().id(11L).build();
            User u2 = User.createUser("b@b.com", "p", "n2", "0").toBuilder().id(12L).build();
            Seller se1 = TestFixture.spySellerWithId(TestFixture.createSeller(u1), 21L);
            Seller se2 = TestFixture.spySellerWithId(TestFixture.createSeller(u2), 22L);
            Stream s1 = TestFixture.spyStreamWithId(Stream.builder().seller(se1).build(), 1L);
            Stream s2 = TestFixture.spyStreamWithId(Stream.builder().seller(se2).build(), 2L);
            given(streamRepository.findAllActiveStreams(null)).willReturn(List.of(s1, s2));
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
            User user = User.createUser("h@t.com", "pw", "h", "0").toBuilder().id(1L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(user), 30L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.LIVE).build(), 100L);
            given(streamRepository.findById(100L)).willReturn(Optional.of(stream));
            given(streamViewerService.enter(100L, 1L)).willReturn("id_1");
            given(liveKitProperties.apiKey()).willReturn("k"); given(liveKitProperties.apiSecret()).willReturn("s");
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of());

            StreamEnterResponse response = streamService.enterStream(1L, 100L);

            assertThat(response.token()).isNotNull();
            assertThat(response.isHost()).isTrue();
            TEST_LOG.info("    [검증] ✔ LiveKit JWT 토큰 및 호스트 여부 확인");
        }

        @Test @Order(4)
        @DisplayName("Q-4. 방송 상세 없으면 STREAM_NOT_FOUND")
        void getStream_whenMissing_throws() {
            given(streamRepository.findById(404L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> streamService.getStream(1L, 404L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(StreamErrorCode.STREAM_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ STREAM_NOT_FOUND");
        }

        @Test @Order(5)
        @DisplayName("Q-5. 내 예약·라이브 목록 (getScheduledStreamList)")
        void getScheduledStreamList_success() {
            User u = User.createUser("u@u.com", "p", "n", "010").toBuilder().id(1L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 40L);
            Stream st = TestFixture.spyStreamWithId(Stream.builder()
                    .title("예약방송")
                    .category(Category.ELECTRONICS)
                    .status(StreamStatus.SCHEDULED)
                    .seller(seller)
                    .build(), 200L);
            SliceImpl<Stream> slice = new SliceImpl<>(List.of(st), PageRequest.of(0, 5), false);
            given(streamRepository.findByStatusInAndSellerUserId(
                    eq(List.of(StreamStatus.LIVE, StreamStatus.SCHEDULED, StreamStatus.PAUSED)),
                    eq(1L),
                    any(Pageable.class)))
                    .willReturn(slice);

            ScheduledStreamListResponse response = streamService.getScheduledStreamList(1L, 0, 5);

            assertThat(response.streams()).hasSize(1);
            assertThat(response.streams().get(0).streamId()).isEqualTo(200L);
            assertThat(response.hasNext()).isFalse();
            TEST_LOG.info("    [검증] ✔ 예약 목록");
        }

        @Test @Order(6)
        @DisplayName("Q-6. 신규 셀러 라이브 추천 (getNewSellerLiveStreams)")
        void getNewSellerLiveStreams_success() {
            User u = User.createUser("n@n.com", "p", "신인", "010").toBuilder().id(1L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 41L);
            Stream stream = TestFixture.spyStreamWithId(Stream.builder()
                    .title("라이브")
                    .category(Category.ELECTRONICS)
                    .status(StreamStatus.LIVE)
                    .seller(seller)
                    .build(), 11L);
            given(streamRepository.findLiveStreamsByNewSellers(any())).willReturn(List.of(stream));
            given(streamViewerService.getViewerCount(11L)).willReturn(7L);

            List<StreamRecommendResponse> list = streamService.getNewSellerLiveStreams(7, 5);

            assertThat(list).hasSize(1);
            assertThat(list.get(0).streamId()).isEqualTo(11L);
            assertThat(list.get(0).viewerCount()).isEqualTo(7L);
            TEST_LOG.info("    [검증] ✔ 추천 스트림");
        }

        @Test @Order(7)
        @DisplayName("Q-7. 입장 — 스트림 없으면 STREAM_NOT_FOUND")
        void enterStream_whenMissing_throws() {
            given(streamRepository.findById(999L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> streamService.enterStream(1L, 999L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(StreamErrorCode.STREAM_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ STREAM_NOT_FOUND");
        }

        @Test @Order(8)
        @DisplayName("Q-8. 입장 — 판매자가 아니면 isHost=false")
        void enterStream_whenViewer_notHost() {
            User host = User.createUser("h@h.com", "p", "호스트", "010").toBuilder().id(88L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(host), 42L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.LIVE).build(), 100L);
            User viewer = User.createUser("v@v.com", "p", "시청", "010").toBuilder().id(1L).build();

            given(streamRepository.findById(100L)).willReturn(Optional.of(stream));
            given(streamViewerService.enter(100L, 1L)).willReturn("id_1");
            given(liveKitProperties.apiKey()).willReturn("k");
            given(liveKitProperties.apiSecret()).willReturn("s");
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of());
            given(userRepository.findById(1L)).willReturn(Optional.of(viewer));
            given(followRepository.existsByUserAndSeller(viewer, seller)).willReturn(false);

            StreamEnterResponse response = streamService.enterStream(1L, 100L);

            assertThat(response.isHost()).isFalse();
            TEST_LOG.info("    [검증] ✔ 비호스트");
        }

        @Test @Order(9)
        @DisplayName("Q-9. 방송 연결 경매 물품 목록 (getStreamItems)")
        void getStreamItems_success() {
            Item item = TestFixture.spyItemWithId(Item.builder()
                    .name("상품A")
                    .description("d")
                    .category(Category.ELECTRONICS)
                    .status(ItemStatus.READY)
                    .itemCondition(ItemCondition.BRAND_NEW)
                    .build(), 1L);
            Auction auction = TestFixture.spyAuctionWithId(
                    TestFixture.createAuction(AuctionType.BOTTOM_UP, AuctionStatus.READY, null, item), 50L);
            Stream stream = TestFixture.spyStreamWithId(Stream.builder().build(), 100L);

            given(streamRepository.findById(100L)).willReturn(Optional.of(stream));
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of(auction));

            StreamItemsResponse response = streamService.getStreamItems(100L);

            assertThat(response.items()).hasSize(1);
            assertThat(response.items().get(0).itemName()).isEqualTo("상품A");
            assertThat(response.items().get(0).auctionId()).isEqualTo(50L);
            TEST_LOG.info("    [검증] ✔ 물품 목록");
        }

        @Test @Order(10)
        @DisplayName("Q-10. 목록 LATEST — 페이지 리포지토리 경로")
        void getStreamList_latest_usesPagedQuery() {
            User u = User.createUser("a@a.com", "p", "n1", "010").toBuilder().id(1L).build();
            Seller sel = TestFixture.spySellerWithId(TestFixture.createSeller(u), 43L);
            Stream s1 = TestFixture.spyStreamWithId(Stream.builder()
                    .title("t")
                    .category(Category.ELECTRONICS)
                    .status(StreamStatus.LIVE)
                    .seller(sel)
                    .build(), 1L);
            Page<Stream> page = new PageImpl<>(List.of(s1), PageRequest.of(0, 10, Sort.by("createdAt").descending()), 1);
            given(streamRepository.findActiveStreams(isNull(), any(Pageable.class))).willReturn(page);
            given(streamViewerService.getViewerCount(1L)).willReturn(3L);

            StreamListRequest request =
                    new StreamListRequest(StreamViewType.ALL, null, StreamStatus.LIVE, StreamSortType.LATEST, 0, 10);
            Page<StreamListItemResponse> result = streamService.getStreamList(request);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).streamId()).isEqualTo(1L);
            TEST_LOG.info("    [검증] ✔ findActiveStreams·매핑");
        }

        @Test @Order(11)
        @DisplayName("Q-11. 팔로잉 탭 + 비로그인 시 빈 페이지")
        void getStreamList_followingAnonymous_returnsEmpty() {
            SecurityContext securityContext = mock(SecurityContext.class);
            Authentication authentication = mock(Authentication.class);
            given(securityContext.getAuthentication()).willReturn(authentication);
            given(authentication.getName()).willReturn("anonymousUser");

            try (MockedStatic<SecurityContextHolder> holder = Mockito.mockStatic(SecurityContextHolder.class)) {
                holder.when(SecurityContextHolder::getContext).thenReturn(securityContext);

                StreamListRequest request = new StreamListRequest(
                        StreamViewType.FOLLOWING, null, StreamStatus.LIVE, StreamSortType.LATEST, 0, 10);
                Page<StreamListItemResponse> result = streamService.getStreamList(request);

                assertThat(result.getContent()).isEmpty();
            }
            TEST_LOG.info("    [검증] ✔ 빈 Page");
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
            User su = User.createUser("s@s.com", "p", "s", "010").toBuilder().id(2L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(su), 8L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.SCHEDULED).build(), 100L);
            Item item1 = TestFixture.spyItemWithId(Item.builder().status(ItemStatus.SCHEDULED).build(), 1L);
            Item item2 = TestFixture.spyItemWithId(Item.builder().status(ItemStatus.SCHEDULED).build(), 2L);
            Item item3 = TestFixture.spyItemWithId(Item.builder().status(ItemStatus.READY).build(), 3L);
            BottomUpAuctionDetail bottomUpFor1 = BottomUpAuctionDetail.builder()
                    .startPrice(1000L)
                    .bidUnit(100L)
                    .build();
            Auction auction1 = TestFixture.createBottomUpAuctionEntity(
                    item1, AuctionStatus.READY, null, bottomUpFor1);
            Auction auction2 = TestFixture.createBottomUpAuctionEntity(item2, AuctionStatus.READY, null, null);

            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 8L)).willReturn(Optional.of(stream));
            given(auctionRepository.findByStreamId(100L)).willReturn(List.of(auction1, auction2));
            given(itemRepository.findByIdAndSellerId(1L, 8L)).willReturn(Optional.of(item1));
            given(itemRepository.findByIdAndSellerId(3L, 8L)).willReturn(Optional.of(item3));

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

        @Test @Order(2)
        @DisplayName("U-2. 수정 — 스트림 없으면 STREAM_NOT_FOUND")
        void updateStream_whenStreamMissing_throws() {
            User u = User.createUser("u@u.com", "p", "u", "010").toBuilder().id(2L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 7L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 7L)).willReturn(Optional.empty());
            StreamUpdateRequest req = new StreamUpdateRequest("제목", null, null, null, "공지", null);

            assertThatThrownBy(() -> streamService.updateStream(1L, 100L, req, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(StreamErrorCode.STREAM_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ STREAM_NOT_FOUND");
        }

        @Test @Order(3)
        @DisplayName("U-3. 라이브 방송에서 경매 목록 변경 불가 (STREAM_AUCTION_UPDATE_NOT_ALLOWED)")
        void updateStream_whenLiveAndAuctionItems_throws() {
            User host = User.createUser("h@h.com", "p", "h", "010").toBuilder().id(1L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(host), 5L);
            Stream stream = TestFixture.spyStreamWithId(
                    Stream.builder().seller(seller).status(StreamStatus.LIVE).build(), 100L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 5L)).willReturn(Optional.of(stream));
            StreamUpdateRequest req = new StreamUpdateRequest(
                    "제목",
                    null,
                    null,
                    null,
                    "공지",
                    List.of(new StreamRegisterRequest.AuctionItemRequest(
                            1L,
                            AuctionType.BOTTOM_UP,
                            60,
                            new StreamRegisterRequest.BottomUpAuctionDetailRequest(1000L, 100L),
                            null)));

            assertThatThrownBy(() -> streamService.updateStream(1L, 100L, req, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(StreamErrorCode.STREAM_AUCTION_UPDATE_NOT_ALLOWED));
            TEST_LOG.info("    [검증] ✔ STREAM_AUCTION_UPDATE_NOT_ALLOWED");
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
            User u = User.createUser("m@m.com", "p", "m", "010").toBuilder().id(2L).build();
            Seller seller = TestFixture.spySellerWithId(TestFixture.createSeller(u), 6L);
            Stream macroStream = TestFixture.spyStreamWithId(Stream.builder().build(), 100L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));
            given(streamRepository.findByIdAndSellerId(100L, 6L)).willReturn(Optional.of(macroStream));
            given(streamRepository.findById(100L)).willReturn(Optional.of(macroStream));
            given(macroRedisRepository.findAll(100L)).willReturn(java.util.Collections.emptyMap());

            streamService.saveMacros(1L, 100L, new MacroSaveRequest(List.of(new MacroSaveRequest.MacroItem("Q", "A"))));
            streamService.getMacros(100L, null);

            verify(macroRedisRepository).saveAll(eq(100L), any());
            verify(macroRedisRepository).findAll(100L);
            TEST_LOG.info("    [검증] ✔ Redis 입출력(save/findAll) 위임 확인");
        }

        @Test @Order(2)
        @DisplayName("E-2. 매크로 저장 — 판매자 없으면 SELLER_NOT_FOUND")
        void saveMacros_whenSellerMissing_throws() {
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.empty());

            assertThatThrownBy(() ->
                    streamService.saveMacros(1L, 100L, new MacroSaveRequest(List.of(new MacroSaveRequest.MacroItem("Q", "A")))))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(SellerErrorCode.SELLER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ SELLER_NOT_FOUND");
        }

        @Test @Order(3)
        @DisplayName("E-3. 매크로 조회 — 스트림 없으면 STREAM_NOT_FOUND")
        void getMacros_whenStreamMissing_throws() {
            given(streamRepository.findById(404L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> streamService.getMacros(404L, null))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(StreamErrorCode.STREAM_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ STREAM_NOT_FOUND");
        }
    }
}
