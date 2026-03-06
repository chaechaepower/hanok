package com.ssafy.be.domain.user.service;

import com.ssafy.be.domain.user.dto.request.SignupRequestDto;
import com.ssafy.be.domain.user.dto.response.SignupResponseDto;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// [Service Layer]
// 비즈니스 로직을 담당
// Controller에서 호출 → Repository로 DB 접근
// 예외 발생 시 GlobalException으로 던지면 GlobalExceptionHandler가 처리
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // SecurityConfig에 등록한 BCrypt 빈 주입

    // -----------------------------------------------
    // 이메일 중복 확인
    // GET /api/v1/auth/check-email?email=xxx
    // -----------------------------------------------
    @Transactional(readOnly = true)
    public void checkEmailDuplicate(String email) {
        // DB에서 이메일 존재 여부 확인
        // existsByEmail() → SELECT COUNT(*) FROM user WHERE email = ?
        if (userRepository.existsByEmail(email)) {
            throw new GlobalException(UserErrorCode.EMAIL_ALREADY_EXISTS);
        }
    }

    // -----------------------------------------------
    // 회원가입
    // POST /api/v1/auth/signup
    // -----------------------------------------------
    @Transactional
    public SignupResponseDto signup(SignupRequestDto requestDto) {

        // 1. 이메일 중복 확인
        // 회원가입 시에도 한 번 더 체크 (check-email API를 안 거칠 수도 있으므로)
        if (userRepository.existsByEmail(requestDto.email())) {
            throw new GlobalException(UserErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 2. 비밀번호 암호화
        // BCrypt 해시 알고리즘으로 암호화 (복호화 불가)
        String encodedPassword = passwordEncoder.encode(requestDto.password());

        // 3. Entity 생성
        // DTO 내부의 toEntity()로 변환 (Service에서 직접 new User() 하지 않음)
        User user = requestDto.toEntity(encodedPassword);

        // 4. DB 저장
        // JpaRepository의 save() → INSERT INTO user ...
        User savedUser = userRepository.save(user);

        // 5. 응답 DTO 변환 후 반환
        // DTO 내부의 fromEntity()로 변환 (Entity를 직접 반환하지 않음)
        return SignupResponseDto.fromEntity(savedUser);
    }
}