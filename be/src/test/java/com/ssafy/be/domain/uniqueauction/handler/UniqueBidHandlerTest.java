package com.ssafy.be.domain.uniqueauction.handler;

import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidAckResponse;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidStatsResponse;
import com.ssafy.be.domain.uniqueaction.handler.UniqueBidCalculateHandler;
import com.ssafy.be.domain.uniqueaction.handler.UniqueBidPlaceHandler;
import com.ssafy.be.domain.uniqueaction.handler.UniqueBidStartHandler;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.extension.TestReportExtension;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("UniqueBid Handler 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class UniqueBidHandlerTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Mock UniqueBidAuctionService uniqueBidAuctionService;
    @Mock JsonConverter jsonConverter;
    @Mock StreamPublisher streamPublisher;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║     UniqueBid Handler 단위 테스트 Suite 시작             ║");
        TEST_LOG.info("║  Layer   : Handler (WebSocket)                           ║");
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

    // ═══ Section 1 : StartHandler ════════════════════════════════
    @Nested @Order(1)
    @DisplayName("Section 1 │ UniqueBidStartHandler")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StartHandlerTest {

        @InjectMocks UniqueBidStartHandler startHandler;

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 1 │ UniqueBidStartHandler");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("S-1. getEventType() → UNIQUE_AUCTION_START")
        void getEventType() {
            assertThat(startHandler.getEventType()).isEqualTo(StreamEventType.UNIQUE_AUCTION_START);
            TEST_LOG.info("    [검증] ✔ UNIQUE_AUCTION_START 확인");
        }

        @Test @Order(2)
        @DisplayName("S-2. handle() → startAuction() 1회 + publish() N회")
        void handle_delegatesToService() {
            Long streamId = 1L;
            Long userId   = 10L;
            StompRequest<String> request = new StompRequest<>(StreamEventType.UNIQUE_AUCTION_START, "{}");
            UniqueBidStartRequest req = UniqueBidStartRequest.builder().auctionId(1L).build();

            @SuppressWarnings("unchecked")
            StreamPublishTask<String> task1 = StreamPublishTask.<String>builder()
                    .destType(DestType.BROADCAST).streamId(streamId)
                    .eventType(StreamEventType.UNIQUE_AUCTION_START).payload("{}").build();

            given(jsonConverter.convert(any(), eq(UniqueBidStartRequest.class))).willReturn(req);
            given(uniqueBidAuctionService.startAuction(eq(streamId), eq(req), eq(userId)))
                    .willReturn(List.of(task1));

            startHandler.handle(request, streamId,
                    new UsernamePasswordAuthenticationToken(String.valueOf(userId), null));

            verify(uniqueBidAuctionService, times(1)).startAuction(eq(streamId), eq(req), eq(userId));
            verify(streamPublisher, times(1)).publish(eq(task1));
            TEST_LOG.info("    [검증] ✔ startAuction() 1회, publish() task 수만큼 호출 확인");
        }
    }

    // ═══ Section 2 : PlaceHandler ════════════════════════════════
    @Nested @Order(2)
    @DisplayName("Section 2 │ UniqueBidPlaceHandler")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class PlaceHandlerTest {

        @InjectMocks UniqueBidPlaceHandler placeHandler;

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 2 │ UniqueBidPlaceHandler");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("P-1. getEventType() → UNIQUE_BID_PLACE")
        void getEventType() {
            assertThat(placeHandler.getEventType()).isEqualTo(StreamEventType.UNIQUE_BID_PLACE);
            TEST_LOG.info("    [검증] ✔ UNIQUE_BID_PLACE 확인");
        }

        @Test @Order(2)
        @DisplayName("P-2. handle() → placeBid() + sendToUser(ACK) + broadcast(STATS) 각 1회")
        void handle_delegatesToService() {
            Long streamId = 1L;
            Long userId   = 20L;
            long amount   = 50000L;
            long count    = 3L;

            StompRequest<String> request = new StompRequest<>(StreamEventType.UNIQUE_BID_PLACE, "{}");
            UniqueBidPlaceRequest req = UniqueBidPlaceRequest.builder()
                    .auctionId(1L).amount(amount).build();

            given(jsonConverter.convert(any(), eq(UniqueBidPlaceRequest.class))).willReturn(req);
            given(uniqueBidAuctionService.placeBid(eq(req), eq(userId))).willReturn(count);

            placeHandler.handle(request, streamId,
                    new UsernamePasswordAuthenticationToken(String.valueOf(userId), null));

            verify(uniqueBidAuctionService, times(1)).placeBid(eq(req), eq(userId));
            verify(streamPublisher, times(1)).sendToUser(
                    eq(userId), eq(streamId), eq(StreamEventType.UNIQUE_BID_ACK),
                    any(UniqueBidAckResponse.class));
            verify(streamPublisher, times(1)).broadcast(
                    eq(streamId), eq(StreamEventType.UNIQUE_AUCTION_STATS),
                    any(UniqueBidStatsResponse.class));
            TEST_LOG.info("    [검증] ✔ placeBid(), sendToUser(ACK), broadcast(STATS) 각 1회 위임 확인");
        }
    }

    // ═══ Section 3 : CalculateHandler ════════════════════════════
    @Nested @Order(3)
    @DisplayName("Section 3 │ UniqueBidCalculateHandler")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class CalculateHandlerTest {

        @InjectMocks UniqueBidCalculateHandler calculateHandler;

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 3 │ UniqueBidCalculateHandler");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("C-1. getEventType() → UNIQUE_AUCTION_CALCULATING")
        void getEventType() {
            assertThat(calculateHandler.getEventType()).isEqualTo(StreamEventType.UNIQUE_AUCTION_CALCULATING);
            TEST_LOG.info("    [검증] ✔ UNIQUE_AUCTION_CALCULATING 확인");
        }

        @Test @Order(2)
        @DisplayName("C-2. handle() → getParticipantCount() + broadcast(CALCULATING) + aggregate() 각 1회")
        void handle_delegatesToService() {
            Long streamId = 1L;
            Long auctionId = 1L;
            long count    = 5L;

            StompRequest<String> request = new StompRequest<>(StreamEventType.UNIQUE_AUCTION_CALCULATING, "{}");
            UniqueBidCalculateRequest req = UniqueBidCalculateRequest.builder().auctionId(auctionId).build();

            @SuppressWarnings("unchecked")
            StreamPublishTask<String> broadcastTask = StreamPublishTask.<String>builder()
                    .destType(DestType.BROADCAST).streamId(streamId)
                    .eventType(StreamEventType.UNIQUE_AUCTION_END).payload("{}").build();

            given(jsonConverter.convert(any(), eq(UniqueBidCalculateRequest.class))).willReturn(req);
            given(uniqueBidAuctionService.getParticipantCount(eq(auctionId))).willReturn(count);
            given(uniqueBidAuctionService.aggregate(eq(req))).willReturn(List.of(broadcastTask));

            calculateHandler.handle(request, streamId,
                    new UsernamePasswordAuthenticationToken("42", null));

            verify(uniqueBidAuctionService, times(1)).getParticipantCount(eq(auctionId));
            verify(uniqueBidAuctionService, times(1)).aggregate(eq(req));
            verify(streamPublisher, times(1)).broadcast(
                    eq(streamId), eq(StreamEventType.UNIQUE_AUCTION_CALCULATING), any());
            TEST_LOG.info("    [검증] ✔ getParticipantCount(), broadcast(CALCULATING), aggregate() 각 1회 확인");
        }
    }
}
