package com.ssafy.be.domain.user.controller;

import com.ssafy.be.domain.user.dto.request.IdentityVerificationRequestDto;
import com.ssafy.be.domain.user.dto.request.SignupRequestDto;
import com.ssafy.be.domain.user.dto.response.IdentityVerificationResponseDto;
import com.ssafy.be.domain.user.dto.response.SignupResponseDto;
import com.ssafy.be.domain.user.service.UserService;
import com.ssafy.be.global.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


// [Controller Layer]
// HTTP 요청을 받아서 Service에 전달하고 응답을 반환
// 비즈니스 로직은 Service에서 처리, Controller는 요청/응답만 담당
// @Valid로 DTO 검증 → 실패 시 GlobalExceptionHandler가 처리
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    // -----------------------------------------------
    // 이메일 중복 확인
    // GET /api/v1/auth/check-email?email=xxx
    // -----------------------------------------------
    @Operation(summary = "이메일 중복 확인", description = "이메일 중복 여부를 확인합니다.")
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Void>> checkEmail(
            @RequestParam
            @NotBlank(message = "이메일은 필수입니다.")
            @Email(message = "이메일 형식이 올바르지 않습니다.")
            String email) {

        // Service에서 중복 시 GlobalException(UserErrorCode.EMAIL_ALREADY_EXISTS) 던짐
        // → GlobalExceptionHandler가 409 CONFLICT 응답 반환
        userService.checkEmailDuplicate(email);

        // 중복 없으면 200 OK 반환
        return ResponseEntity.ok(ApiResponse.success());
    }

    // -----------------------------------------------
    // 회원가입
    // POST /api/v1/auth/signup
    // -----------------------------------------------
    @Operation(summary = "회원가입", description = "회원가입을 진행합니다.")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponseDto>> signup(
            @RequestBody @Valid SignupRequestDto requestDto) {

        // @Valid → SignupRequestDto의 @NotBlank, @Email, @Pattern 검증
        // 실패 시 GlobalExceptionHandler가 400 BAD_REQUEST 응답 반환
        SignupResponseDto responseDto = userService.signup(requestDto);

        // 201 CREATED + 응답 DTO 반환
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responseDto));
    }

    // -----------------------------------------------
    // 본인인증 검증
    // POST /api/v1/auth/identity-verification
    // -----------------------------------------------
    @Operation(summary = "본인인증 검증", description = "PortOne 본인인증 결과를 검증합니다.")
    @PostMapping("/identity-verification")
    public ResponseEntity<ApiResponse<IdentityVerificationResponseDto>> verifyIdentity(
            @Valid @RequestBody IdentityVerificationRequestDto requestDto) {

        IdentityVerificationResponseDto response = userService.verifyIdentity(requestDto);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
