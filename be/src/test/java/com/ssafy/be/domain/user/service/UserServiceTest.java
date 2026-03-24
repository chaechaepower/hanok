package com.ssafy.be.domain.user.service;

import com.ssafy.be.domain.notification.dto.request.NotificationSettingRequest;
import com.ssafy.be.domain.notification.dto.response.NotificationSettingResponse;
import com.ssafy.be.domain.user.dto.request.LoginRequestDto;
import com.ssafy.be.domain.user.dto.request.PasswordUpdateRequest;
import com.ssafy.be.domain.user.dto.request.SignupRequestDto;
import com.ssafy.be.domain.user.dto.response.LoginResponseDto;
import com.ssafy.be.domain.user.dto.response.SignupResponseDto;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
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
            User user = User.createUser("test@test.com", "epw", "t", "010");
            given(userRepository.findByEmail("test@test.com")).willReturn(Optional.of(user));
            given(passwordEncoder.matches(anyString(), anyString())).willReturn(true);
            given(jwtUtil.generateToken(any(), any(), any())).willReturn("at");
            given(jwtUtil.generateRefreshToken(any())).willReturn("rt");
            given(jwtUtil.getRefreshExpiration()).willReturn(1000L);

            LoginResponseDto response = userService.login(new LoginRequestDto("test@test.com", "p"));

            assertThat(response.accessToken()).isEqualTo("at");
            verify(redisService).save(eq("refresh:" + user.getId()), eq("rt"), anyLong(), any());
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
    }
}
