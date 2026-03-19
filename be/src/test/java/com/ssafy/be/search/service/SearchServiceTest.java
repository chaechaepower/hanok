package com.ssafy.be.search.service;

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
        TEST_LOG.info("║  시나리오: U-1 ~ U-3  (1 Group / 3 Cases)               ║");
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
}
