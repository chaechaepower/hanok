package com.ssafy.be.domain.user.controller;

import com.ssafy.be.domain.user.dto.request.IdentityVerificationRequestDto;
import com.ssafy.be.domain.user.dto.request.LoginRequestDto;
import com.ssafy.be.domain.user.dto.request.SignupRequestDto;
import com.ssafy.be.domain.user.dto.response.IdentityVerificationResponseDto;
import com.ssafy.be.domain.user.dto.response.LoginResponseDto;
import com.ssafy.be.domain.user.dto.response.SignupResponseDto;
import com.ssafy.be.domain.user.service.UserService;
import com.ssafy.be.global.common.response.ApiResponse;
import com.ssafy.be.global.security.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    // "refreshToken" 문자열 상수로 관리
    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    // -----------------------------------------------
    // 이메일 중복 확인
    // GET /api/v1/auth/check-email?email=xxx
    // -----------------------------------------------
    @Operation(summary = "이메일 중복 확인", description = "이메일 중복 여부를 확인합니다.")
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Void>> checkEmail(
            @RequestParam
            @NotBlank
            @Email
            String email) {

        userService.checkEmailDuplicate(email);
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

        SignupResponseDto responseDto = userService.signup(requestDto);
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

    // -----------------------------------------------
    // 로그인
    // POST /api/v1/auth/login
    // -----------------------------------------------
    @Operation(summary = "로그인", description = "로그인 후 Access Token(헤더), Refresh Token(쿠키) 발급")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(
            @RequestBody @Valid LoginRequestDto requestDto,
            HttpServletResponse response) {

        LoginResponseDto tokens = userService.login(requestDto);

        // Access Token → Authorization 헤더
        response.setHeader("Authorization", "Bearer " + tokens.accessToken());

        // Refresh Token → HttpOnly Cookie
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshCookie(tokens.refreshToken()).toString());

        return ResponseEntity.ok(ApiResponse.success(tokens));
    }

    // -----------------------------------------------
    // 로그아웃
    // POST /api/v1/auth/logout
    // -----------------------------------------------
    @Operation(summary = "로그아웃", description = "Refresh Token 삭제 및 Access Token 블랙리스트 등록")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        String token = jwtUtil.resolveToken(request);
        userService.logout(token);

        // Cookie 삭제
        ResponseCookie deleteCookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

        return ResponseEntity.ok(ApiResponse.success());
    }

    // -----------------------------------------------
    // 토큰 재발급
    // POST /api/v1/auth/refresh
    // -----------------------------------------------
    @Operation(summary = "토큰 재발급", description = "Refresh Token으로 새 Access Token, Refresh Token 발급")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponseDto>> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE) String refreshToken,
            HttpServletResponse response) {

        LoginResponseDto tokens = userService.refresh(refreshToken);

        // 새 Access Token → Authorization 헤더
        response.setHeader("Authorization", "Bearer " + tokens.accessToken());

        // 새 Refresh Token → HttpOnly Cookie 갱신
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshCookie(tokens.refreshToken()).toString());

        return ResponseEntity.ok(ApiResponse.success(tokens));
    }

    // Refresh Token 쿠키 생성 헬퍼 메서드 (중복 제거)
    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(true)      // prod에서는 true로 변경
                .path("/")
                .maxAge(Duration.ofDays(7))
                .sameSite("None")
                .build();
    }
}