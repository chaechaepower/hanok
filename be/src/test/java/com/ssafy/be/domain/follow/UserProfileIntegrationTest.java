package com.ssafy.be.domain.follow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.entity.SellerType;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.dto.request.AccountRegisterRequest;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.support.annotation.IntegrationTest;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Slf4j
@IntegrationTest
@AutoConfigureMockMvc(addFilters = false) // 필터가 꺼져있어도 principal 주입이 가능하게 수정함
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
class UserProfileIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private FollowRepository followRepository;
    @Autowired private ObjectMapper objectMapper;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private com.ssafy.be.global.infra.portone.PortoneClient portoneClient;

    private User buyer;
    private User sellerUser;
    private Seller seller;

    @BeforeAll
    void initData() {
        buyer = userRepository.save(User.createUser("buyer@test.com", "pw", "구매자", "010-1111-1111"));
        sellerUser = userRepository.save(User.createUser("seller@test.com", "pw", "판매자", "010-2222-2222"));

        seller = sellerRepository.save(Seller.builder()
                .intro("안녕하세요 판매자입니다.")
                .type(SellerType.INDIVIDUAL)
                .penaltyCount(0)
                .user(sellerUser)
                .build());

        log.info("🚀 [테스트 준비] 데이터 생성 완료 (Buyer ID: {}, Seller User ID: {})", buyer.getId(), sellerUser.getId());
    }

    @AfterEach
    void clearAuth() {
        // 테스트 마다 인증 정보 초기화
        SecurityContextHolder.clearContext();
    }

    /**
     * 필터가 꺼진 환경(addFilters = false)에서 @AuthenticationPrincipal을 속이는 핵심 로직
     */
    private void setMockAuthentication(Long userId) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userId.toString(), null, Collections.emptyList());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    @Order(1)
    @DisplayName("1. 팔로우 성공 테스트")
    void testToggleFollow_Success() throws Exception {
        log.info("▶️ [실행] 팔로우 토글 테스트");

        // [핵심] 호출 전 인증 정보를 수동으로 Context에 세팅
        setMockAuthentication(buyer.getId());

        mockMvc.perform(post("/api/v1/users/{userId}/follow", sellerUser.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.following").value(true));

        assertThat(followRepository.existsByUserAndSeller(buyer, seller)).isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("2. 언팔로우 성공 테스트")
    void testToggleUnfollow_Success() throws Exception {
        log.info("▶️ [실행] 언팔로우 테스트");

        // 미리 팔로우 상태로 저장
        followRepository.save(com.ssafy.be.domain.follow.entity.Follow.builder()
                .user(buyer)
                .seller(seller)
                .build());

        setMockAuthentication(buyer.getId());

        mockMvc.perform(post("/api/v1/users/{userId}/follow", sellerUser.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.following").value(false));

        assertThat(followRepository.existsByUserAndSeller(buyer, seller)).isFalse();
    }

    @Test
    @Order(3)
    @DisplayName("3. 본인 팔로우 금지 테스트")
    void testSelfFollow_Fail() throws Exception {
        setMockAuthentication(buyer.getId());

        mockMvc.perform(post("/api/v1/users/{userId}/follow", buyer.getId()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    @DisplayName("4. 프로필 이미지 업로드 테스트")
    void testUploadProfileImage() throws Exception {
        setMockAuthentication(buyer.getId());

        MockMultipartFile file = new MockMultipartFile(
                "image", "test.png", MediaType.IMAGE_PNG_VALUE, "content".getBytes());

        mockMvc.perform(multipart("/api/v1/users/me/profile-image")
                        .file(file)
                        .with(request -> { request.setMethod("PATCH"); return request; }))
                .andExpect(status().isOk());
    }

    @Test
    @Order(5)
    @DisplayName("5. 계좌 정보 등록 테스트")
    void testRegisterAccount() throws Exception {
        setMockAuthentication(buyer.getId());

        AccountRegisterRequest request = new AccountRegisterRequest("004", "홍길동", "123-456-789");

        mockMvc.perform(post("/api/v1/users/me/accounts")
                        .content(objectMapper.writeValueAsString(request))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        User updatedUser = userRepository.findById(buyer.getId()).orElseThrow();
        assertThat(updatedUser.getAccountNum()).isEqualTo("123-456-789");
    }
}