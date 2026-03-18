package com.ssafy.be.search.controller;

import com.ssafy.be.domain.search.controller.SearchController;
import com.ssafy.be.domain.search.service.SearchService;
import com.ssafy.be.global.extension.TestReportExtension;
import com.ssafy.be.global.security.filter.JwtAuthenticationFilter;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        value = SearchController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("SearchController 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class SearchControllerTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @Autowired
    MockMvc mockMvc;
    @MockitoBean
    SearchService searchService;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       SearchController 단위 테스트 Suite 시작            ║");
        TEST_LOG.info("║  Layer   : Controller (MockMvc)                          ║");
        TEST_LOG.info("║  Mock    : SearchService                                 ║");
        TEST_LOG.info("║  시나리오: C-1 ~ C-5  (3 Group / 5 Cases)               ║");
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

    // ═══ Group 1 : 입력값 Validation ═══════════════════════════
    @Nested
    @Order(1)
    @DisplayName("Group 1 │ 입력값 Validation")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class Validation {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 1 │ 입력값 Validation");
            TEST_LOG.info("│  검증 목표: blank/1자/51자 → 400 Bad Request");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("C-1. 빈 keyword → SEARCH_003 (KEYWORD_BLANK) 400")
        void search_blankKeyword_returns400() throws Exception {
            TEST_LOG.info("    [요청] GET /api/v1/search?keyword=   (공백)");

            mockMvc.perform(get("/api/v1/search").param("keyword", "   "))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("SEARCH_003"));

            TEST_LOG.info("    [검증] ✔ 400 + SEARCH_003 확인");
            TEST_LOG.info("    [해소] 공백 keyword 거부 보장");
        }

        @Test
        @Order(2)
        @DisplayName("C-2. 1자 keyword → SEARCH_001 (KEYWORD_TOO_SHORT) 400")
        void search_tooShortKeyword_returns400() throws Exception {
            TEST_LOG.info("    [요청] GET /api/v1/search?keyword=나 (1자)");

            mockMvc.perform(get("/api/v1/search").param("keyword", "나"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("SEARCH_001"));

            TEST_LOG.info("    [검증] ✔ 400 + SEARCH_001 확인");
            TEST_LOG.info("    [해소] 2자 미만 keyword 거부 보장");
        }

        @Test
        @Order(3)
        @DisplayName("C-3. 51자 keyword → SEARCH_002 (KEYWORD_TOO_LONG) 400")
        void search_tooLongKeyword_returns400() throws Exception {
            String keyword = "가".repeat(51);
            TEST_LOG.info("    [요청] GET /api/v1/search?keyword=\"가\"×51");

            mockMvc.perform(get("/api/v1/search").param("keyword", keyword))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("SEARCH_002"));

            TEST_LOG.info("    [검증] ✔ 400 + SEARCH_002 확인");
            TEST_LOG.info("    [해소] 50자 초과 keyword 거부 보장");
        }
    }

    // ═══ Group 2 : 정상 흐름 ════════════════════════════════════
    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 정상 흐름")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class HappyPath {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 정상 흐름");
            TEST_LOG.info("│  검증 목표: 유효 keyword → 200 + SearchService 위임");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("C-4. 유효 keyword → 200 응답 + SearchService.search() 1회 호출")
        void search_validKeyword_returns200() throws Exception {
            TEST_LOG.info("    [요청] GET /api/v1/search?keyword=나이키");
            given(searchService.search("나이키")).willReturn(List.of());

            mockMvc.perform(get("/api/v1/search").param("keyword", "나이키"))
                    .andExpect(status().isOk());

            verify(searchService, times(1)).search("나이키");
            TEST_LOG.info("    [검증] ✔ 200 OK 확인");
            TEST_LOG.info("    [검증] ✔ searchService.search() 1회 위임 확인");
            TEST_LOG.info("    [해소] Controller → Service 위임 계약 보장");
        }

        @Test
        @Order(2)
        @DisplayName("C-5. keyword param 누락 → 400 (Spring MissingServletRequestParameterException)")
        void search_missingParam_returns400() throws Exception {
            TEST_LOG.info("    [요청] GET /api/v1/search (keyword 파라미터 없음)");

            mockMvc.perform(get("/api/v1/search"))
                    .andExpect(status().isBadRequest());

            TEST_LOG.info("    [검증] ✔ 400 Bad Request 확인");
            TEST_LOG.info("    [해소] @RequestParam 필수 파라미터 누락 처리 보장");
        }
    }
}
