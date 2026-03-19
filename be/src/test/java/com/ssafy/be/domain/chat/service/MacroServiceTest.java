package com.ssafy.be.domain.chat.service;

import com.ssafy.be.domain.chat.dto.payload.MacroTemplatePayload;
import com.ssafy.be.domain.chat.dto.request.MacroTemplateRequest;
import com.ssafy.be.domain.chat.exception.MacroErrorCode;
import com.ssafy.be.domain.stream.repository.MacroRedisRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.extension.TestReportExtension;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("MacroService 단위 테스트")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class MacroServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks
    MacroService macroService;

    @Mock
    MacroRedisRepository macroRedisRepository;

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       MacroService 단위 테스트 Suite 시작                ║");
        TEST_LOG.info("║  Layer   : Service                                       ║");
        TEST_LOG.info("║  Mock    : MacroRedisRepository                          ║");
        TEST_LOG.info("║  시나리오: M-1 ~ M-2  (2 Group)                          ║");
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
            TEST_LOG.info("│  검증 목표: 유효한 질문(QuestionType)으로 매크로 조회 성공");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("M-1. 유효한 QuestionType으로 매크로 답변 조회")
        void handleMacro_validQuestion_returnsPayload() {
            TEST_LOG.info("    [진행] streamId=1, questionType='배송' 요청");
            MacroTemplateRequest request = new MacroTemplateRequest("배송");
            given(macroRedisRepository.findOne(1L, "배송")).willReturn("오후 2시 이전 주문 시 당일 발송됩니다.");

            MacroTemplatePayload payload = macroService.handleMacro(1L, request);

            assertThat(payload.questionType()).isEqualTo("배송");
            assertThat(payload.answer()).isEqualTo("오후 2시 이전 주문 시 당일 발송됩니다.");
            assertThat(payload.sender()).isEqualTo("seller");
            
            verify(macroRedisRepository, times(1)).findOne(1L, "배송");
            TEST_LOG.info("    [검증] ✔ 정상 페이로드 반환 및 Repository 위임 확인");
        }
    }

    @Nested
    @Order(2)
    @DisplayName("Group 2 │ 예외 상황 (Step-up)")
    @ExtendWith(TestReportExtension.class)
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class StepUp {

        @BeforeAll
        static void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Group 2 │ 예외 상황 (Step-up)");
            TEST_LOG.info("│  검증 목표: 존재하지 않는 매크로 질의 시 예외 검증");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("M-2. 미등록 QuestionType 요청 시 → MACRO_NOT_FOUND 예외 발생")
        void handleMacro_invalidQuestion_throwsException() {
            TEST_LOG.info("    [진행] 등록되지 않은 질의('환불') 요청 -> null 반환 연출");
            MacroTemplateRequest request = new MacroTemplateRequest("환불");
            given(macroRedisRepository.findOne(1L, "환불")).willReturn(null);

            GlobalException exception = assertThrows(GlobalException.class, () -> {
                macroService.handleMacro(1L, request);
            });

            assertThat(exception.getErrorCode()).isEqualTo(MacroErrorCode.MACRO_NOT_FOUND);
            verify(macroRedisRepository, times(1)).findOne(1L, "환불");
            TEST_LOG.info("    [검증] ✔ MACRO_NOT_FOUND 예외 정상 Throw 확인");
        }
    }
}
