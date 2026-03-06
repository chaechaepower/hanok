package com.ssafy.be.domain.user.service;

import com.ssafy.be.domain.user.dto.request.SignupRequestDto;
import com.ssafy.be.domain.user.dto.response.SignupResponseDto;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("이메일 중복 시 GlobalException 발생")
    void signup_EmailDuplicate_ThrowsGlobalException() {
        // given
        given(userRepository.existsByEmail("test@test.com")).willReturn(true);

        // Record는 생성자로 바로 생성
        SignupRequestDto requestDto = new SignupRequestDto(
                "test@test.com",
                "Test1234!",
                "테스터",
                "01012345678"
        );

        // when & then
        assertThatThrownBy(() -> userService.signup(requestDto))
                .isInstanceOf(GlobalException.class)
                .satisfies(e -> {
                    GlobalException ge = (GlobalException) e;
                    assertThat(ge.getErrorCode()).isEqualTo(UserErrorCode.EMAIL_ALREADY_EXISTS);
                });
    }

    @Test
    @DisplayName("정상 회원가입 시 저장 성공")
    void signup_ValidRequest_Success() {
        // given
        given(userRepository.existsByEmail("test@test.com")).willReturn(false);
        given(passwordEncoder.encode("Test1234!")).willReturn("encodedPassword");
        given(userRepository.save(any(User.class))).willReturn(
                User.createUser("test@test.com", "encodedPassword", "테스터", "01012345678")
        );

        SignupRequestDto requestDto = new SignupRequestDto(
                "test@test.com",
                "Test1234!",
                "테스터",
                "01012345678"
        );

        // when
        SignupResponseDto response = userService.signup(requestDto);

        // then
        assertThat(response.email()).isEqualTo("test@test.com");      // Record는 email() 형태
        assertThat(response.nickname()).isEqualTo("테스터");           // getter 아니고 email(), nickname()
    }
}

