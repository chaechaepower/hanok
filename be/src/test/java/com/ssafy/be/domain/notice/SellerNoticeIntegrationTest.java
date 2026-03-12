package com.ssafy.be.domain.notice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.Storage;
import com.ssafy.be.domain.notice.dto.request.NoticeCreateRequest;
import com.ssafy.be.domain.notice.dto.request.NoticeUpdateRequest;
import com.ssafy.be.domain.notice.repository.SellerNoticeRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.support.annotation.IntegrationTest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
@IntegrationTest
@AutoConfigureMockMvc(addFilters = false)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SellerNoticeIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Autowired private SellerNoticeRepository noticeRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private UserRepository userRepository;

    // 🌟 외부 연동으로 인해 컨텍스트 로드를 방해하는 빈들을 Mock 처리
    @MockitoBean private PortoneClient portoneClient;
    @MockitoBean private Storage storage;

    // 수동 ID 대신 DB에서 생성된 ID를 저장할 변수들
    private Long myUserId;
    private Long hackerUserId;
    private Long mySellerId;
    private Long hackerSellerId;
    private Long targetNoticeId;

    // ✅ SecurityContext에 principal 주입 — JWT 필터가 하던 역할을 대신
    private void setAuth(Long userId) {
        var auth = new UsernamePasswordAuthenticationToken(
                String.valueOf(userId), null, List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @BeforeAll
    void setUp() {
        log.info("========== [TEST SETUP] 공지사항 테스트 환경 초기화 시작 ==========");
        noticeRepository.deleteAll();
        sellerRepository.deleteAll();
        userRepository.deleteAll();

        // 🌟 1. 정상 유저 & 사업자(BUSINESS) 셀러 생성 (팩토리 메서드 활용)
        User myUser = userRepository.save(User.createUser(
                "test@test.com",
                "encodedPassword123!",
                "정상테스터",
                "010-1234-5678"
        ));
        myUserId = myUser.getId();

        Seller mySeller = sellerRepository.save(Seller.builder()
                .intro("안녕하세요! 테스트 사업자 셀러입니다.")
                .rating(5.0)
                .type(SellerType.BUSINESS)
                .user(myUser)
                .build());
        mySellerId = mySeller.getId();

        // 🌟 2. 해커 유저 & 개인(INDIVIDUAL) 셀러 생성 (팩토리 메서드 활용)
        User hackerUser = userRepository.save(User.createUser(
                "hacker@test.com",
                "hackerPassword123!",
                "해커유저",
                "010-9999-9999"
        ));
        hackerUserId = hackerUser.getId();

        Seller hackerSeller = sellerRepository.save(Seller.builder()
                .intro("나는 해커다.")
                .rating(1.0)
                .type(SellerType.INDIVIDUAL)
                .user(hackerUser)
                .build());
        hackerSellerId = hackerSeller.getId();

        log.info("▶ [완료] 테스트용 정상 사업자(ID: {}) 및 해커 개인(ID: {}) 세팅 완료", mySellerId, hackerSellerId);
        log.info("========================================================\n");
    }

    @BeforeEach
    void setDefaultAuth() {
        setAuth(myUserId); // ✅ 각 테스트 시작 시 정상 유저로 기본 초기화
    }

    @AfterEach
    void tearDown(TestInfo testInfo) {
        SecurityContextHolder.clearContext(); // ✅ 테스트 간 컨텍스트 오염 방지
        log.info("✅ [PASS] {}", testInfo.getDisplayName());
        log.info("--------------------------------------------------");
    }

    // ────────────────────────────────────────────────────────────
    // Order 1: 공지사항 작성 (CREATE)
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(1)
    @DisplayName("1. [POST] 공지사항 작성 검증")
    void testCreateNotice() throws Exception {
        log.info("========== [TEST REPORT] 1. 공지사항 작성 ==========");

        NoticeCreateRequest request = new NoticeCreateRequest("첫 공지사항 제목", "공지사항 내용입니다. 반갑습니다!");
        String requestBody = objectMapper.writeValueAsString(request);

        log.info("▶ [STEP 1] 셀러 ID [{}]로 공지사항 작성 요청", mySellerId);
        MvcResult result = mockMvc.perform(post("/api/v1/sellers/" + mySellerId + "/notices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("첫 공지사항 제목"))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        targetNoticeId = responseNode.path("noticeId").asLong();

        log.info("  ↳ 생성 성공! 발급된 공지사항 ID: {}", targetNoticeId);
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 2: 공지사항 목록 조회 (READ LIST)
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(2)
    @DisplayName("2. [GET] 공지사항 목록 조회 검증")
    void testGetNotices() throws Exception {
        log.info("========== [TEST REPORT] 2. 공지사항 목록 조회 ==========");

        log.info("▶ [STEP 1] 셀러 ID [{}]의 공지사항 목록 요청", mySellerId);
        MvcResult result = mockMvc.perform(get("/api/v1/sellers/" + mySellerId + "/notices")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8));

        log.info("  ↳ 조회 성공 | 총 {}개의 공지사항", responseNode.size());
        Assertions.assertTrue(responseNode.size() > 0, "목록에 공지사항이 최소 1개 이상 존재해야 합니다.");
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 3: 공지사항 단건 조회 (READ SINGLE)
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(3)
    @DisplayName("3. [GET] 공지사항 단건 조회 검증")
    void testGetNotice() throws Exception {
        log.info("========== [TEST REPORT] 3. 공지사항 단건 조회 ==========");

        log.info("▶ [STEP 1] 공지사항 ID [{}] 단건 상세 조회 요청", targetNoticeId);
        mockMvc.perform(get("/api/v1/sellers/" + mySellerId + "/notices/" + targetNoticeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.noticeId").value(targetNoticeId))
                .andExpect(jsonPath("$.title").value("첫 공지사항 제목"));

        log.info("  ↳ 단건 조회 데이터 검증 완료");
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 4: 공지사항 수정 (UPDATE)
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(4)
    @DisplayName("4. [PUT] 공지사항 수정 검증")
    void testUpdateNotice() throws Exception {
        log.info("========== [TEST REPORT] 4. 공지사항 수정 ==========");

        NoticeUpdateRequest request = new NoticeUpdateRequest("수정된 공지사항 제목", "수정된 내용입니다.");
        String requestBody = objectMapper.writeValueAsString(request);

        log.info("▶ [STEP 1] 공지사항 ID [{}] 수정 요청", targetNoticeId);
        mockMvc.perform(put("/api/v1/sellers/" + mySellerId + "/notices/" + targetNoticeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("수정된 공지사항 제목"));

        log.info("  ↳ 수정 처리 API 호출 및 변경된 데이터 반환 확인 완료");
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 5: 보안 엣지케이스 - 해커 접근 차단
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(5)
    @DisplayName("5. [PUT] 보안 - 해커가 타 셀러의 공지사항 수정 시도")
    void testUnauthorizedUpdate() throws Exception {
        log.info("========== [TEST REPORT] 5. 타인 공지사항 접근 차단 검증 ==========");

        NoticeUpdateRequest hackerRequest = new NoticeUpdateRequest("해킹된 제목", "다 지워버리겠다!");
        String requestBody = objectMapper.writeValueAsString(hackerRequest);

        log.info("▶ [STEP 1] 해커 셀러(ID:{})가 정상 셀러(ID:{})의 공지사항(ID:{}) 수정 시도",
                hackerSellerId, mySellerId, targetNoticeId);

        // ✅ 해커로 컨텍스트 교체 후 자신의 sellerId 경로에 타인의 targetNoticeId 조작 요청
        setAuth(hackerUserId);
        MvcResult failResult = mockMvc.perform(put("/api/v1/sellers/" + hackerSellerId + "/notices/" + targetNoticeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden()) // NoticeErrorCode.UNAUTHORIZED_NOTICE_ACCESS
                .andExpect(jsonPath("$.code").value("Notice-002"))
                .andReturn();

        JsonNode errorNode = objectMapper.readTree(
                failResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        log.info("  ↳ 방어 성공! 403 Forbidden | 에러코드: {}", errorNode.path("code").asText());
        log.info("========================================================\n");
    }

    // ────────────────────────────────────────────────────────────
    // Order 6: 공지사항 삭제 (DELETE)
    // ────────────────────────────────────────────────────────────
    @Test
    @Order(6)
    @DisplayName("6. [DELETE] 공지사항 삭제 검증")
    void testDeleteNotice() throws Exception {
        log.info("========== [TEST REPORT] 6. 공지사항 삭제 ==========");

        log.info("▶ [STEP 1] 공지사항 ID [{}] 삭제 요청", targetNoticeId);
        mockMvc.perform(delete("/api/v1/sellers/" + mySellerId + "/notices/" + targetNoticeId))
                .andExpect(status().isNoContent());
        log.info("  ↳ 삭제 처리 API 호출 성공 (HTTP 204)");

        log.info("▶ [STEP 2] 삭제된 공지사항 다시 조회하여 404 확인");
        mockMvc.perform(get("/api/v1/sellers/" + mySellerId + "/notices/" + targetNoticeId))
                .andExpect(status().isNotFound()) // NoticeErrorCode.NOTICE_NOT_FOUND
                .andExpect(jsonPath("$.code").value("Notice-001"));

        log.info("  ↳ 정상 삭제됨을 DB 조회(404)를 통해 최종 확인");
        log.info("========================================================\n");
    }
}