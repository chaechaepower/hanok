package com.ssafy.be.search.service;

import com.ssafy.be.domain.search.dto.StreamSearchRow;
import com.ssafy.be.domain.search.dto.response.StreamSearchResult;
import com.ssafy.be.domain.search.repository.StreamSearchRepositoryCustom;
import com.ssafy.be.domain.search.service.SearchService;
import com.ssafy.be.domain.stream.service.StreamViewerService;
import com.ssafy.be.global.extension.TestReportExtension;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
@DisplayName("SearchService 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class SearchServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks SearchService searchService;
    @Mock StreamSearchRepositoryCustom searchRepository;
    @Mock StreamViewerService streamViewerService;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       SearchService 단위 테스트 Suite 시작               ║");
        TEST_LOG.info("║  Layer   : Service (Pure Unit)                           ║");
        TEST_LOG.info("║  Mock    : StreamSearchRepositoryCustom                  ║");
        TEST_LOG.info("║           StreamViewerService                            ║");
        TEST_LOG.info("║  시나리오: U-1 ~ U-5  (2 Group / 5 Cases)               ║");
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

    // ═══ Group 1 : keyword 전처리 ══════════════════════════════
    @Nested @Order(1)
    @DisplayName("Group 1 │ keyword 전처리")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class KeywordPreprocessing {

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 1 │ keyword 전처리");
            TEST_LOG.info("│  검증 목표: trim + 특수문자 제거 → empty면 DB 미조회");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("U-1. 공백만 → 빈 리스트, Repository 미호출")
        void search_blank_returnsEmpty() {
            TEST_LOG.info("    [요청] keyword = \"   \"");
            List<StreamSearchResult> result = searchService.search("   ");
            assertThat(result).isEmpty();
            verifyNoInteractions(searchRepository);
            TEST_LOG.info("    [검증] ✔ 빈 리스트 + DB 미조회 확인");
            TEST_LOG.info("    [해소] trim 후 empty → early return 보장");
        }

        @Test @Order(2)
        @DisplayName("U-2. FULLTEXT 특수기호만 → 빈 리스트, Repository 미호출")
        void search_specialCharsOnly_returnsEmpty() {
            TEST_LOG.info("    [요청] keyword = \"+-><()~*\"");
            List<StreamSearchResult> result = searchService.search("+-><()~*");
            assertThat(result).isEmpty();
            verifyNoInteractions(searchRepository);
            TEST_LOG.info("    [검증] ✔ 특수문자 제거 후 empty → DB 미조회 확인");
            TEST_LOG.info("    [해소] BOOLEAN MODE 특수기호 안전 처리 보장");
        }

        @Test @Order(3)
        @DisplayName("U-3. 유효 keyword → trim 후 Repository 호출")
        void search_validKeyword_callsRepositoryWithTrimmed() {
            TEST_LOG.info("    [요청] keyword = \"  나이키  \" (앞뒤 공백)");
            given(searchRepository.searchByStreamTitle("나이키")).willReturn(List.of());
            given(searchRepository.searchByItemName("나이키")).willReturn(List.of());
            given(searchRepository.searchByTagName("나이키")).willReturn(List.of());
            searchService.search("  나이키  ");
            verify(searchRepository).searchByStreamTitle("나이키");
            TEST_LOG.info("    [검증] ✔ trim된 \"나이키\" 로 Repository 호출 확인");
            TEST_LOG.info("    [해소] trim 후 정제된 keyword 전달 보장");
        }
    }

    // ═══ Group 2 : 결과 합산 및 중복 처리 ══════════════════════
    @Nested @Order(2)
    @DisplayName("Group 2 │ 결과 합산 및 중복 streamId 병합")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ResultMerging {

        @BeforeAll static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 결과 합산 및 중복 streamId 병합");
            TEST_LOG.info("│  검증 목표: 동일 streamId가 여러 소스에서 나와도 1건으로 병합");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("U-4. 3개 소스 모두 호출, 동일 streamId 중복 병합")
        void search_allRepositoriesCalled_duplicateStreamIdMerged() {
            TEST_LOG.info("    [준비] streamId=1 이 방송제목·아이템명·태그 모두에서 조회되는 Mock");
            // StreamSearchRow: streamId, title, thumbnail, status, scheduledAt, viewerCount, category, sellerId, sellerNickname, sellerProfileImageUri
            StreamSearchRow row = StreamSearchRow.builder()
                    .streamId(1L).title("나이키 런닝화 라이브").status("LIVE")
                    .sellerId(1L).sellerNickname("판매자").build();

            given(searchRepository.searchByStreamTitle("나이키")).willReturn(List.of(row));
            given(searchRepository.searchByItemName("나이키")).willReturn(List.of(row));
            given(searchRepository.searchByTagName("나이키")).willReturn(List.of(row));
            given(streamViewerService.getViewerCount(1L)).willReturn(120L);

            List<StreamSearchResult> results = searchService.search("나이키");

            // 동일 streamId이므로 결과는 1건
            assertThat(results).hasSize(1);
            verify(searchRepository, times(1)).searchByStreamTitle("나이키");
            verify(searchRepository, times(1)).searchByItemName("나이키");
            verify(searchRepository, times(1)).searchByTagName("나이키");
            // matchReasons 3개 누적 (record accessor)
            assertThat(results.get(0).matchReasons()).hasSize(3);

            TEST_LOG.info("    [검증] ✔ 결과 1건 + matchReasons 3개 누적 확인");
            TEST_LOG.info("    [해소] 동일 stream 중복 없이 matchReason만 추가됨 보장");
        }

        @Test @Order(2)
        @DisplayName("U-5. LIVE viewerCount 반영, SCHEDULED는 0 고정")
        void search_viewerCount_byStatus() {
            TEST_LOG.info("    [준비] LIVE 스트림과 SCHEDULED 스트림 각 1건 Mock");
            StreamSearchRow liveRow = StreamSearchRow.builder()
                    .streamId(1L).title("LIVE 방송").status("LIVE")
                    .sellerId(1L).sellerNickname("판매자A").build();
            StreamSearchRow scheduledRow = StreamSearchRow.builder()
                    .streamId(2L).title("예약 방송").status("SCHEDULED")
                    .sellerId(2L).sellerNickname("판매자B").build();

            given(searchRepository.searchByStreamTitle("방송")).willReturn(List.of(liveRow, scheduledRow));
            given(searchRepository.searchByItemName("방송")).willReturn(List.of());
            given(searchRepository.searchByTagName("방송")).willReturn(List.of());
            given(streamViewerService.getViewerCount(1L)).willReturn(200L);

            List<StreamSearchResult> results = searchService.search("방송");

            assertThat(results).hasSize(2);
            // record accessor 사용
            StreamSearchResult live      = results.stream().filter(r -> r.streamId() == 1L).findFirst().orElseThrow();
            StreamSearchResult scheduled = results.stream().filter(r -> r.streamId() == 2L).findFirst().orElseThrow();
            assertThat(live.viewerCount()).isEqualTo(200);
            assertThat(scheduled.viewerCount()).isEqualTo(0);

            TEST_LOG.info("    [검증] ✔ LIVE viewerCount=200, SCHEDULED viewerCount=0 확인");
            TEST_LOG.info("    [해소] 방송상태·시청자수 분기 로직 정상 동작 보장");
        }
    }
}
