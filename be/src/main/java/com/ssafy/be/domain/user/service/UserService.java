package com.ssafy.be.domain.user.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.be.domain.notification.dto.request.NotificationSettingRequest;
import com.ssafy.be.domain.notification.dto.response.NotificationSettingResponse;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.user.dto.request.*;
import com.ssafy.be.domain.user.dto.response.*;
import com.ssafy.be.domain.user.entity.BankCode;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.gcs.GcsClient;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;import com.ssafy.be.global.infra.portone.PortoneClient;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;

import com.ssafy.be.global.infra.redis.RedisService;
import com.ssafy.be.global.security.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.util.concurrent.TimeUnit;

// [Service Layer]
// 비즈니스 로직을 담당
// Controller에서 호출 → Repository로 DB 접근
// 예외 발생 시 GlobalException으로 던지면 GlobalExceptionHandler가 처리
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PortoneClient portOneClient;
    private final RedisService redisService;
    private final JwtUtil jwtUtil;
    private final GcsClient gcsClient;
    private final SellerRepository sellerRepository;

    private static final String REFRESH_TOKEN_PREFIX = "refresh:";
    private static final String BLACKLIST_PREFIX = "blacklist:";
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
        User user = User.createUser(
                requestDto.email(),
                encodedPassword,
                requestDto.nickname(),
                requestDto.phone()
        );

        // 4. DB 저장
        // JpaRepository의 save() → INSERT INTO user ...
        User savedUser = userRepository.save(user);

        // 5. 응답 DTO 변환 후 반환
        // DTO 내부의 fromEntity()로 변환 (Entity를 직접 반환하지 않음)
        return SignupResponseDto.fromEntity(savedUser);
    }

    // -----------------------------------------------
    // 본인인증 검증
    // POST /api/v1/auth/identity-verification
    // -----------------------------------------------
    public IdentityVerificationResponseDto verifyIdentity(
            IdentityVerificationRequestDto requestDto) {

        // 1. PortOne API로 인증 결과 조회
        JsonNode result;
        try {
            result = portOneClient.getIdentityVerification(requestDto.identityVerificationId());
        } catch (RestClientException e) {
            throw new GlobalException(UserErrorCode.IDENTITY_VERIFICATION_NOT_FOUND);
        }

        // 2. 인증 상태 확인
        String status = result.path("status").asText();
        if (!"VERIFIED".equals(status)) {
            throw new GlobalException(UserErrorCode.IDENTITY_VERIFICATION_FAILED);
        }

        // 3. 인증 정보 추출
        JsonNode verifiedCustomer = result.path("verifiedCustomer");
        if (verifiedCustomer.isMissingNode()) {
            throw new GlobalException(UserErrorCode.IDENTITY_VERIFICATION_NOT_FOUND);
        }

        String name = verifiedCustomer.path("name").asText();
        String phoneNumber = verifiedCustomer.path("phoneNumber").asText();
        String birthDate = verifiedCustomer.path("birthDate").asText();

        return new IdentityVerificationResponseDto(name, phoneNumber, birthDate);
    }
    // -----------------------------------------------
    // 로그인
    // POST /api/v1/auth/login
    // -----------------------------------------------
    @Transactional(readOnly = true)
    public LoginResponseDto login(LoginRequestDto requestDto) {

        // 1. 이메일로 유저 조회
        User user = userRepository.findByEmail(requestDto.email())
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(requestDto.password(), user.getPassword())) {
            throw new GlobalException(UserErrorCode.INVALID_PASSWORD);
        }

        // 3. 토큰 발급
        String accessToken = jwtUtil.generateToken(user.getId(), "USER", user.getNickname());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 4. Refresh Token Redis 저장 (7일)
        redisService.save(REFRESH_TOKEN_PREFIX + user.getId(), refreshToken,
                jwtUtil.getRefreshExpiration(), TimeUnit.MILLISECONDS);

        return new LoginResponseDto(accessToken, refreshToken);
    }

    // -----------------------------------------------
    // 로그아웃
    // POST /api/v1/auth/logout
    // -----------------------------------------------
    public void logout(String accessToken) {

        // Access Token 검증 제거 (필터에서 이미 검증됨)
        Claims claims = jwtUtil.validateToken(accessToken);
        Long userId = Long.parseLong(claims.getSubject());

        // Refresh Token 삭제
        redisService.delete(REFRESH_TOKEN_PREFIX + userId);

        // Access Token 블랙리스트 등록
        long expiration = jwtUtil.getExpiration(accessToken);
        if (expiration > 0) {
            redisService.save(BLACKLIST_PREFIX + accessToken, "logout", expiration, TimeUnit.MILLISECONDS);
        }
    }

    // -----------------------------------------------
    // 토큰 재발급
    // POST /api/v1/auth/refresh
    // -----------------------------------------------
    public LoginResponseDto refresh(String refreshToken) {

        // 1. Refresh Token 검증
        Claims claims;
        try {
            claims = jwtUtil.validateToken(refreshToken);
        } catch (JwtException e) {
            throw new GlobalException(UserErrorCode.INVALID_REFRESH_TOKEN);
        }

        Long userId = Long.parseLong(claims.getSubject());

        // 2. Redis에서 Refresh Token 존재 여부 확인
        String savedToken = redisService.get(REFRESH_TOKEN_PREFIX + userId);
        if (savedToken == null || !savedToken.equals(refreshToken)) {
            throw new GlobalException(UserErrorCode.INVALID_REFRESH_TOKEN);
        }

        // 3. 새 토큰 발급 (Refresh Token Rotation)
        String newAccessToken = jwtUtil.generateToken(userId, "USER", claims.get("nickname",String.class));
        String newRefreshToken = jwtUtil.generateRefreshToken(userId);

        // 4. Redis 업데이트
        redisService.save(REFRESH_TOKEN_PREFIX + userId, newRefreshToken,
                jwtUtil.getRefreshExpiration(), TimeUnit.MILLISECONDS);

        return new LoginResponseDto(newAccessToken, newRefreshToken);
    }

    // -----------------------------------------------
// 프로필 이미지 업로드
// PATCH /api/v1/users/me/profile-image
// -----------------------------------------------
    @Transactional
    public String uploadProfileImage(Long userId, MultipartFile file) throws IOException {

        // 1. 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 2. 기존 이미지 삭제 (있을 경우)
        if (user.getProfileImage() != null) {
            gcsClient.deleteImage(user.getProfileImage());
        }

        // 3. 새 이미지 업로드
        String imageUrl = gcsClient.uploadProfileImage(file, userId);

        // 4. DB 업데이트
        user.updateProfileImage(imageUrl);

        return imageUrl;
    }

    // -----------------------------------------------
// 계좌 등록
// POST /api/v1/users/me/accounts
// -----------------------------------------------
    @Transactional
    public AccountRegisterResponse registerAccount(Long userId, AccountRegisterRequest request) {

        // 1. 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 2. 은행 코드 검증
        BankCode bankCode = BankCode.fromCode(request.bankCode());

        // 3. 계좌 정보 저장
        user.updateAccount(bankCode, request.accountName(), request.accountNum());

        return new AccountRegisterResponse(bankCode.getName(), request.accountName(), request.accountNum());
    }

    // -----------------------------------------------
    // 내 계정 정보 조회
    // GET /api/v1/users/me
    // -----------------------------------------------
    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));
        return toUserProfileResponse(user);
    }

    private UserProfileResponse toUserProfileResponse(User user) {
        Long sellerId = sellerRepository.findByUserId(user.getId())
                .map(seller -> seller.getId())
                .orElse(null);

        return UserProfileResponse.builder()
                .email(user.getEmail())
                .nickname(user.getNickname())
                .profileImage(user.getProfileImage())
                .phone(user.getPhone())
                .balance(user.getBalance())
                .depositedBalance(user.getDepositedBidBalance()
                        + user.getDepositedEscrowBalance()
                        + user.getDepositedWithdrawBalance())
                .bankCode(user.getBankCode())
                .accountName(user.getAccountName())
                .accountNum(user.getAccountNum())
                .sellerId(sellerId)
                .build();
    }

    @Transactional(readOnly = true)
    public AccountRegisterResponse getAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        if (user.getBankCode() == null) {
            return null;
        }

        BankCode bankCode = BankCode.fromCode(user.getBankCode());
        return new AccountRegisterResponse(bankCode.getName(), user.getAccountName(), user.getAccountNum());
    }

    @Transactional
    public void updatePassword(Long userId, PasswordUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 현재 비밀번호 검증
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new GlobalException(UserErrorCode.INVALID_PASSWORD);
        }

        // 새 비밀번호 암호화 후 저장
        user.updatePassword(passwordEncoder.encode(request.newPassword()));
    }

    // -----------------------------------------------
    // 알림 설정 조회
    // GET /api/v1/users/me/notification
    // -----------------------------------------------
    @Transactional(readOnly = true)
    public NotificationSettingResponse getNotificationSetting(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));
        return NotificationSettingResponse.from(user.getNotificationSetting());
    }

    // -----------------------------------------------
    // 알림 설정 수정
    // PATCH /api/v1/users/me/notification
    // -----------------------------------------------
    @Transactional
    public NotificationSettingResponse updateNotificationSetting(
            Long userId, NotificationSettingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));
        user.updateNotificationSetting(request.notificationSetting());
        return NotificationSettingResponse.from(user.getNotificationSetting());
    }
}