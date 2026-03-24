package com.ssafy.be.domain.chat.filter;

import com.ssafy.be.global.extension.TestReportExtension;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("BadWordFilter 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class BadWordFilterTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    private BadWordFilter badWordFilter;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       BadWordFilter 단위 테스트 Suite 시작               ║");
        TEST_LOG.info("║  Layer   : Component (Filter)                            ║");
        TEST_LOG.info("║  시나리오: F-1 ~ F-3  (2 Group)                          ║");
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

    @BeforeEach
    void setUp() {
        badWordFilter = new BadWordFilter();
        badWordFilter.initTries(); // 외부 파일(banned_words.txt) 로드
    }

    @Nested
    @Order(1)
    @DisplayName("Group 1 │ 정상 흐름 (Smoke)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class HappyPath {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 1 │ 정상 흐름 (Smoke)");
            TEST_LOG.info("│  검증 목표: 비속어가 없는 일반 텍스트 정상 통과 확인");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("F-1. 일반 텍스트 입력 시 형태 유지 및 통과")
        void filter_cleanText_returnsOriginal() {
            TEST_LOG.info("    [진행] 일반 텍스트 '안녕하세요 반갑습니다' 필터 통과");
            ChatFilterResult result = badWordFilter.filter("안녕하세요 반갑습니다");

            assertThat(result.isDetected()).isFalse();
            assertThat(result.maskedText()).isEqualTo("안녕하세요 반갑습니다");
            TEST_LOG.info("    [검증] ✔ 정상 통과 및 원본 텍스트 보존 확인");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 필터링 엣지 케이스 (Step-up)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StepUp {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 필터링 엣지 케이스 (Step-up)");
            TEST_LOG.info("│  검증 목표: 비속어 패턴 감지 및 마스킹 처리 여부 확인");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("F-2. 단일 비속어 입력 시 '금칙어' 문자열 감지 확인")
        void filter_badWord_returnsMasked() {
            TEST_LOG.info("    [진행] 텍스트 내 비속어('씨발') 포함 시 동작 확인");
            
            ChatFilterResult result = badWordFilter.filter("아 씨발 진짜 짜증나네");

            assertThat(result.isDetected()).isTrue();
            assertThat(result.maskedText()).isEqualTo("금칙어");
            TEST_LOG.info("    [검증] ✔ isDetected=true 및 '금칙어' 반환 확인");
        }

        @Test
        @Order(2)
        @DisplayName("F-3. 특수문자 삽입 등 변형된 비속어 필터링 확인")
        void filter_variantBadWord_returnsMasked() {
            TEST_LOG.info("    [진행] 우회 시도 비속어('씨!발') 필터 동작 확인");
            
            ChatFilterResult result = badWordFilter.filter("씨!발 이것 좀 봐");

            assertThat(result.isDetected()).isTrue();
            assertThat(result.maskedText()).isEqualTo("금칙어");
            TEST_LOG.info("    [검증] ✔ TextNormalizer 연계를 통한 변형 비속어 방어 확인");
        }

        @Test
        @Order(3)
        @DisplayName("F-4. 허용어 포함 시 필터링 미감지 확인 (예: '발가락')")
        void filter_allowedWord_returnsOriginal() {
            TEST_LOG.info("    [진행] 허용어('발가락') 포함 문장 필터 동작 확인");
            // '발'은 금칙어지만 '발가락'은 허용어 사전(allowed_words.txt)에 포함되어 있음
            ChatFilterResult result = badWordFilter.filter("내 발가락 너무 길어");

            assertThat(result.isDetected()).isFalse();
            assertThat(result.maskedText()).isEqualTo("내 발가락 너무 길어");
            TEST_LOG.info("    [검증] ✔ 허용어 우선순위 적용으로 정상 문장 통과 확인");
        }
    }
}
