package com.ssafy.be.domain.user.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.notification.dto.request.NotificationSettingRequest;
import com.ssafy.be.domain.notification.dto.response.NotificationSettingResponse;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.dto.request.AccountRegisterRequest;
import com.ssafy.be.domain.user.dto.request.IdentityVerificationRequestDto;
import com.ssafy.be.domain.user.dto.request.LoginRequestDto;
import com.ssafy.be.domain.user.dto.request.PasswordUpdateRequest;
import com.ssafy.be.domain.user.dto.request.SignupRequestDto;
import com.ssafy.be.domain.user.dto.response.IdentityVerificationResponseDto;
import com.ssafy.be.domain.user.dto.response.LoginResponseDto;
import com.ssafy.be.domain.user.dto.response.SignupResponseDto;
import com.ssafy.be.domain.user.dto.response.UserProfileResponse;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.storage.gcs.GcsClient;
import com.ssafy.be.global.infra.portone.PortoneClient;
import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import com.ssafy.be.support.util.TestFixture;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 도메인 로직 테스트 (Report Style)")
@TestClassOrder(ClassOrderer.OrderAnnotation.class)
class UserServiceTest {

    private static final Logger TEST_LOG = LoggerFactory.getLogger("TEST_REPORT");
    private static final long SUITE_START = System.currentTimeMillis();

    @InjectMocks private UserService userService;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private RedisService redisService;
    @Mock private JwtUtil jwtUtil;
    @Mock private PortoneClient portoneClient;
    @Mock private GcsClient gcsClient;
    @Mock private SellerRepository sellerRepository;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @BeforeAll
    static void suiteStart() {
        TEST_LOG.info("");
        TEST_LOG.info("╔══════════════════════════════════════════════════════════╗");
        TEST_LOG.info("║       UserService 비즈니스 로직 테스트 Suite 시작          ║");
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
    @DisplayName("Section 1 │ 회원가입 (Signup)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UserSignupTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 1 │ User Signup");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("S-1. 이메일 중복 시 예외 발생")
        void signup_EmailDuplicate_ThrowsGlobalException() {
            given(userRepository.existsByEmail("test@test.com")).willReturn(true);
            SignupRequestDto requestDto = new SignupRequestDto("test@test.com", "P!", "T", "010");

            assertThatThrownBy(() -> userService.signup(requestDto))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e -> {
                        GlobalException ge = (GlobalException) e;
                        assertThat(ge.getErrorCode()).isEqualTo(UserErrorCode.EMAIL_ALREADY_EXISTS);
                    });
            TEST_LOG.info("    [검증] ✔ EMAIL_ALREADY_EXISTS 예외 발생 확인");
        }

        @Test @Order(2)
        @DisplayName("S-2. 정상 회원가입 성공")
        void signup_ValidRequest_Success() {
            given(userRepository.existsByEmail("test@test.com")).willReturn(false);
            given(passwordEncoder.encode(anyString())).willReturn("encoded");
            given(userRepository.save(any(User.class))).willReturn(User.createUser("test@test.com", "e", "테스터", "010"));

            SignupResponseDto response = userService.signup(new SignupRequestDto("test@test.com", "p", "테스터", "010"));

            assertThat(response.email()).isEqualTo("test@test.com");
            TEST_LOG.info("    [검증] ✔ 회원가입 데이터 저장 및 응답 확인");
        }

        @Test @Order(3)
        @DisplayName("S-3. checkEmailDuplicate — 이미 존재하면 예외")
        void checkEmailDuplicate_whenExists_throws() {
            given(userRepository.existsByEmail("dup@dup.com")).willReturn(true);

            assertThatThrownBy(() -> userService.checkEmailDuplicate("dup@dup.com"))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.EMAIL_ALREADY_EXISTS));
            TEST_LOG.info("    [검증] ✔ EMAIL_ALREADY_EXISTS");
        }

        @Test @Order(4)
        @DisplayName("S-4. checkEmailDuplicate — 없으면 통과")
        void checkEmailDuplicate_whenNew_ok() {
            given(userRepository.existsByEmail("new@new.com")).willReturn(false);

            assertThatCode(() -> userService.checkEmailDuplicate("new@new.com")).doesNotThrowAnyException();
            TEST_LOG.info("    [검증] ✔ 예외 없음");
        }
    }

    @Nested @Order(2)
    @DisplayName("Section 2 │ 인증 및 권한 (Login/Logout)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UserAuthTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 2 │ User Auth");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("A-1. 로그인 성공 및 토큰 발급")
        void login_Success() {
            User user = User.createUser("test@test.com", "epw", "t", "010").toBuilder().id(1L).build();
            given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(true);
            given(jwtUtil.generateToken(any(), any(), any())).willReturn("at");
            given(jwtUtil.generateRefreshToken(any())).willReturn("rt");
            given(jwtUtil.getRefreshExpiration()).willReturn(1000L);

            LoginResponseDto response = userService.login(new LoginRequestDto("test@test.com", "p"));

            assertThat(response.accessToken()).isEqualTo("at");
            verify(redisService).save(eq("refresh:1"), eq("rt"), anyLong(), any());
            TEST_LOG.info("    [검증] ✔ 토큰 반환 및 Redis 리프레시 토큰 저장 확인");
        }

        @Test @Order(2)
        @DisplayName("A-2. 로그아웃 시 토큰 블랙리스트 등록")
        void logout_Success() {
            String at = "accessToken";
            Claims claims = mock(Claims.class);
            given(claims.getSubject()).willReturn("1");
            given(jwtUtil.validateToken(at)).willReturn(claims);
            given(jwtUtil.getExpiration(at)).willReturn(1000L);

            userService.logout(at);

            verify(redisService).delete("refresh:1");
            verify(redisService).save(eq("blacklist:" + at), eq("logout"), anyLong(), any());
            TEST_LOG.info("    [검증] ✔ 리프레시 토큰 삭제 및 블랙리스트 등록 확인");
        }

        @Test @Order(3)
        @DisplayName("A-3. 로그인 — 이메일 없으면 USER_NOT_FOUND")
        void login_whenUserMissing_throws() {
            given(userRepository.findByEmail("x@x.com")).willReturn(Optional.empty());

            assertThatThrownBy(() -> userService.login(new LoginRequestDto("x@x.com", "p")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }

        @Test @Order(4)
        @DisplayName("A-4. 로그인 — 비밀번호 불일치 시 INVALID_PASSWORD")
        void login_whenPasswordWrong_throws() {
            User user = User.createUser("a@a.com", "enc", "n", "010");
            given(userRepository.findByEmail("a@a.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

            assertThatThrownBy(() -> userService.login(new LoginRequestDto("a@a.com", "wrong")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.INVALID_PASSWORD));
            TEST_LOG.info("    [검증] ✔ INVALID_PASSWORD");
        }

        @Test @Order(5)
        @DisplayName("A-5. refresh — JwtException 시 INVALID_REFRESH_TOKEN")
        void refresh_whenJwtInvalid_throws() {
            given(jwtUtil.validateToken("bad")).willThrow(new JwtException("bad"));

            assertThatThrownBy(() -> userService.refresh("bad"))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.INVALID_REFRESH_TOKEN));
            TEST_LOG.info("    [검증] ✔ INVALID_REFRESH_TOKEN");
        }

        @Test @Order(6)
        @DisplayName("A-6. refresh — Redis 값 불일치 시 INVALID_REFRESH_TOKEN")
        void refresh_whenRedisMismatch_throws() {
            Claims claims = mock(Claims.class);
            given(claims.getSubject()).willReturn("2");
            given(jwtUtil.validateToken("rt")).willReturn(claims);
            given(redisService.get("refresh:2")).willReturn("other");

            assertThatThrownBy(() -> userService.refresh("rt"))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.INVALID_REFRESH_TOKEN));
            TEST_LOG.info("    [검증] ✔ 리프레시 불일치");
        }

        @Test @Order(7)
        @DisplayName("A-7. refresh — 정상 시 토큰 회전")
        void refresh_success() {
            Claims claims = mock(Claims.class);
            given(claims.getSubject()).willReturn("3");
            given(claims.get("nickname", String.class)).willReturn("닉");
            given(jwtUtil.validateToken("oldRt")).willReturn(claims);
            given(redisService.get("refresh:3")).willReturn("oldRt");
            given(jwtUtil.generateToken(3L, "USER", "닉")).willReturn("newAt");
            given(jwtUtil.generateRefreshToken(3L)).willReturn("newRt");
            given(jwtUtil.getRefreshExpiration()).willReturn(2000L);

            LoginResponseDto response = userService.refresh("oldRt");

            assertThat(response.accessToken()).isEqualTo("newAt");
            assertThat(response.refreshToken()).isEqualTo("newRt");
            verify(redisService).save(eq("refresh:3"), eq("newRt"), eq(2000L), eq(TimeUnit.MILLISECONDS));
            TEST_LOG.info("    [검증] ✔ 토큰 재발급·Redis 갱신");
        }
    }

    @Nested @Order(3)
    @DisplayName("Section 3 │ 계정 설정 관리 (Password/Notification)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class UserAccountTest {

        @BeforeEach void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 3 │ User Account Settings");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test @Order(1)
        @DisplayName("M-1. 알림 설정 수정")
        void updateNotificationSetting_Success() {
            User user = User.createUser("t@t.com", "p", "n", "0");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            userService.updateNotificationSetting(1L, new NotificationSettingRequest(true));

            assertThat(user.getNotificationSetting()).isTrue();
            TEST_LOG.info("    [검증] ✔ 도메인 엔티티 내 알림 설정 값 반영 확인");
        }

        @Test @Order(2)
        @DisplayName("M-2. 비밀번호 변경")
        void updatePassword_Success() {
            User user = User.createUser("t@t.com", "old", "n", "0");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(true);
            given(passwordEncoder.encode("new")).willReturn("newPw");

            userService.updatePassword(1L, new PasswordUpdateRequest("old", "new"));

            assertThat(user.getPassword()).isEqualTo("newPw");
            TEST_LOG.info("    [검증] ✔ 인코딩된 새 비밀번호 반영 확인");
        }

        @Test @Order(3)
        @DisplayName("M-3. 비밀번호 변경 — 현재 비밀번호 틀리면 INVALID_PASSWORD")
        void updatePassword_whenCurrentWrong_throws() {
            User user = User.createUser("t@t.com", "old", "n", "0");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(false);

            assertThatThrownBy(() -> userService.updatePassword(1L, new PasswordUpdateRequest("wrong", "new")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.INVALID_PASSWORD));
            TEST_LOG.info("    [검증] ✔ INVALID_PASSWORD");
        }

        @Test @Order(4)
        @DisplayName("M-4. 알림 설정 조회")
        void getNotificationSetting_success() {
            User user = User.createUser("t@t.com", "p", "n", "0");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            NotificationSettingResponse response = userService.getNotificationSetting(1L);

            assertThat(response.notificationSetting()).isTrue();
            TEST_LOG.info("    [검증] ✔ 알림 설정 응답");
        }

        @Test @Order(5)
        @DisplayName("M-5. 알림 설정 수정 — 유저 없으면 USER_NOT_FOUND")
        void updateNotificationSetting_whenUserMissing_throws() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateNotificationSetting(99L, new NotificationSettingRequest(false)))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }
    }

    @Nested
    @Order(4)
    @DisplayName("Section 4 │ 본인인증 (verifyIdentity)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class IdentityVerificationTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 4 │ verifyIdentity");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("IV-1. VERIFIED 및 verifiedCustomer 있으면 성공")
        void verifyIdentity_success() throws Exception {
            JsonNode result = OBJECT_MAPPER.readTree(
                    "{\"status\":\"VERIFIED\",\"verifiedCustomer\":{\"name\":\"홍\",\"phoneNumber\":\"010\",\"birthDate\":\"1990-01-01\"}}");
            given(portoneClient.getIdentityVerification("vid")).willReturn(result);

            IdentityVerificationResponseDto dto = userService.verifyIdentity(
                    new IdentityVerificationRequestDto("vid"));

            assertThat(dto.name()).isEqualTo("홍");
            assertThat(dto.phoneNumber()).isEqualTo("010");
            assertThat(dto.birthDate()).isEqualTo("1990-01-01");
            TEST_LOG.info("    [검증] ✔ 인증 정보 반환");
        }

        @Test
        @Order(2)
        @DisplayName("IV-2. PortOne 호출 실패 시 IDENTITY_VERIFICATION_NOT_FOUND")
        void verifyIdentity_whenApiFails_throws() {
            given(portoneClient.getIdentityVerification("vid"))
                    .willThrow(new RestClientException("down"));

            assertThatThrownBy(() -> userService.verifyIdentity(new IdentityVerificationRequestDto("vid")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(UserErrorCode.IDENTITY_VERIFICATION_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ NOT_FOUND");
        }

        @Test
        @Order(3)
        @DisplayName("IV-3. status≠VERIFIED 이면 IDENTITY_VERIFICATION_FAILED")
        void verifyIdentity_whenNotVerified_throws() throws Exception {
            JsonNode result = OBJECT_MAPPER.readTree("{\"status\":\"PENDING\"}");
            given(portoneClient.getIdentityVerification("vid")).willReturn(result);

            assertThatThrownBy(() -> userService.verifyIdentity(new IdentityVerificationRequestDto("vid")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(UserErrorCode.IDENTITY_VERIFICATION_FAILED));
            TEST_LOG.info("    [검증] ✔ FAILED");
        }

        @Test
        @Order(4)
        @DisplayName("IV-4. verifiedCustomer 없으면 IDENTITY_VERIFICATION_NOT_FOUND")
        void verifyIdentity_whenCustomerMissing_throws() throws Exception {
            JsonNode result = OBJECT_MAPPER.readTree("{\"status\":\"VERIFIED\"}");
            given(portoneClient.getIdentityVerification("vid")).willReturn(result);

            assertThatThrownBy(() -> userService.verifyIdentity(new IdentityVerificationRequestDto("vid")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode())
                                    .isEqualTo(UserErrorCode.IDENTITY_VERIFICATION_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ 고객 노드 없음");
        }
    }

    @Nested
    @Order(5)
    @DisplayName("Section 5 │ 프로필·계좌 (getMyProfile / getAccount / registerAccount)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ProfileAndAccountTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 5 │ Profile & Account");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        private User userWithId(long id) {
            return User.createUser("u@u.com", "pw", "닉", "010").toBuilder().id(id).build();
        }

        @Test
        @Order(1)
        @DisplayName("PA-1. getMyProfile — 유저 없으면 USER_NOT_FOUND")
        void getMyProfile_whenMissing_throws() {
            given(userRepository.findById(1L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getMyProfile(1L))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("PA-2. getMyProfile — sellerId·예치 합산·프로필 이미지")
        void getMyProfile_success() {
            User user = userWithId(1L).toBuilder()
                    .balance(100L)
                    .depositedBidBalance(10L)
                    .depositedEscrowBalance(20L)
                    .depositedWithdrawBalance(5L)
                    .bankCode("088")
                    .accountName("예금주")
                    .accountNum("123")
                    .build();
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            Seller seller = TestFixture.createSeller(user);
            ReflectionTestUtils.setField(seller, "id", 50L);
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.of(seller));

            UserProfileResponse response = userService.getMyProfile(1L);

            assertThat(response.getEmail()).isEqualTo("u@u.com");
            assertThat(response.getSellerId()).isEqualTo(50L);
            assertThat(response.getDepositedBalance()).isEqualTo(35L);
            assertThat(response.getProfileImage()).isNotNull();
            TEST_LOG.info("    [검증] ✔ 프로필 응답");
        }

        @Test
        @Order(3)
        @DisplayName("PA-3. getMyProfile — profileImage null이면 GCS 기본 URL")
        void getMyProfile_whenNoImage_usesDefault() {
            User user = userWithId(1L).toBuilder().profileImage(null).build();
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(sellerRepository.findByUserId(1L)).willReturn(Optional.empty());
            given(gcsClient.getDefaultProfileImageUrl()).willReturn("https://default/img.png");

            UserProfileResponse response = userService.getMyProfile(1L);

            assertThat(response.getProfileImage()).isEqualTo("https://default/img.png");
            TEST_LOG.info("    [검증] ✔ 기본 이미지 URL");
        }

        @Test
        @Order(4)
        @DisplayName("PA-4. getAccount — 계좌 없으면 null")
        void getAccount_whenNoBank_returnsNull() {
            User user = userWithId(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            assertThat(userService.getAccount(1L)).isNull();
            TEST_LOG.info("    [검증] ✔ null");
        }

        @Test
        @Order(5)
        @DisplayName("PA-5. registerAccount — 정상 저장")
        void registerAccount_success() {
            User user = userWithId(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            var response = userService.registerAccount(1L, new AccountRegisterRequest("088", "홍길동", "110"));

            assertThat(response.bankName()).contains("신한");
            assertThat(user.getAccountNum()).isEqualTo("110");
            TEST_LOG.info("    [검증] ✔ 계좌 반영");
        }

        @Test
        @Order(6)
        @DisplayName("PA-6. registerAccount — 잘못된 은행코드면 INVALID_BANK_CODE")
        void registerAccount_whenInvalidBank_throws() {
            User user = userWithId(1L);
            given(userRepository.findById(1L)).willReturn(Optional.of(user));

            assertThatThrownBy(() -> userService.registerAccount(1L, new AccountRegisterRequest("999", "a", "1")))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.INVALID_BANK_CODE));
            TEST_LOG.info("    [검증] ✔ INVALID_BANK_CODE");
        }
    }

    @Nested
    @Order(6)
    @DisplayName("Section 6 │ 프로필 이미지 업로드 (uploadProfileImage)")
    @TestMethodOrder(MethodOrderer.OrderAnnotation.class)
    class ProfileImageUploadTest {

        @BeforeEach
        void groupStart() {
            TEST_LOG.info("");
            TEST_LOG.info("┌──────────────────────────────────────────────────────────");
            TEST_LOG.info("│ 📦 Section 6 │ uploadProfileImage");
            TEST_LOG.info("└──────────────────────────────────────────────────────────");
        }

        @Test
        @Order(1)
        @DisplayName("PI-1. 유저 없으면 USER_NOT_FOUND")
        void uploadProfileImage_whenUserMissing_throws() {
            given(userRepository.findById(1L)).willReturn(Optional.empty());
            MultipartFile file = mock(MultipartFile.class);

            assertThatThrownBy(() -> userService.uploadProfileImage(1L, file))
                    .isInstanceOf(GlobalException.class)
                    .satisfies(e ->
                            assertThat(((GlobalException) e).getErrorCode()).isEqualTo(UserErrorCode.USER_NOT_FOUND));
            TEST_LOG.info("    [검증] ✔ USER_NOT_FOUND");
        }

        @Test
        @Order(2)
        @DisplayName("PI-2. 기존 이미지 없으면 delete 미호출")
        void uploadProfileImage_whenNoOldImage_skipsDelete() throws IOException {
            User user = User.createUser("a@a.com", "p", "n", "010").toBuilder().id(1L).profileImage(null).build();
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            MultipartFile file = mock(MultipartFile.class);
            given(gcsClient.uploadProfileImage(file, 1L)).willReturn("https://new");

            String url = userService.uploadProfileImage(1L, file);

            assertThat(url).isEqualTo("https://new");
            verify(gcsClient, never()).deleteImage(anyString());
            verify(gcsClient).uploadProfileImage(file, 1L);
            TEST_LOG.info("    [검증] ✔ 업로드만");
        }

        @Test
        @Order(3)
        @DisplayName("PI-3. 기존 이미지 있으면 삭제 후 업로드")
        void uploadProfileImage_whenOldExists_deletesFirst() throws IOException {
            User user = User.createUser("a@a.com", "p", "n", "010").toBuilder().id(1L).build();
            user.updateProfileImage("https://old");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            MultipartFile file = mock(MultipartFile.class);
            given(gcsClient.uploadProfileImage(file, 1L)).willReturn("https://new");

            userService.uploadProfileImage(1L, file);

            verify(gcsClient).deleteImage("https://old");
            verify(gcsClient).uploadProfileImage(file, 1L);
            TEST_LOG.info("    [검증] ✔ 삭제·업로드");
        }
    }
}
