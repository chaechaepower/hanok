package com.ssafy.be.domain.user.dto.request;

import com.ssafy.be.domain.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// [DTO - Request Layer]
// Record 사용 - 불변 객체, getter 자동 생성 (email(), password() 형태)
// Controller에서 HTTP 요청 Body를 받아주는 객체
// @Valid 어노테이션으로 입력값 검증 수행
// toEntity()로 직접 User Entity로 변환
public record SignupRequestDto(

        @NotBlank()
        @Email()
        String email,

        @NotBlank()
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$",
                message = "비밀번호는 8~20자, 영문/숫자/특수문자를 포함해야 합니다."
        )
        String password,

        @NotBlank()
        String nickname,

        @NotBlank()
        @Pattern(
                regexp = "^01\\d{8,9}$",
                message = "전화번호 형식이 올바르지 않습니다. (예: 01012345678)"
        )
        String phone

) {
    // DTO → Entity 변환 메서드
    public User toEntity(String encodedPassword) {
        return User.createUser(email, encodedPassword, nickname, phone);
    }
}