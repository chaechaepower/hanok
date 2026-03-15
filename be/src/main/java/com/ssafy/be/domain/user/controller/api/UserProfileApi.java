package com.ssafy.be.domain.user.controller.api;


import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.user.dto.request.AccountRegisterRequest;
import com.ssafy.be.domain.user.dto.response.AccountRegisterResponse;
import com.ssafy.be.domain.user.dto.response.UserProfileResponse;
import com.ssafy.be.global.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.ssafy.be.domain.seller.dto.response.SellerStatusResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@Tag(name = "User Profile", description = "사용자 정보 및 상호작용 API")
public interface UserProfileApi {

    @Operation(summary = "프로필 이미지 업로드")
    @PatchMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ApiResponse<String>> uploadProfileImage(
            MultipartFile file,
            String principal) throws IOException;

    @Operation(summary = "계좌 정보 등록/수정")
    @PatchMapping("/me/account")
    ResponseEntity<ApiResponse<AccountRegisterResponse>> registerAccount(
            String principal,
            AccountRegisterRequest request);

    @Operation(summary = "판매자 팔로우/언팔로우")
    @PostMapping("/{userId}/follow")
    ResponseEntity<ApiResponse<FollowResponse>> toggleFollow(
            String principal,
            @PathVariable("userId") Long targetUserId);

    @Operation(summary = "판매자 여부 확인")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/me/seller-status")
    ResponseEntity<ApiResponse<SellerStatusResponse>> getSellerStatus(
            @AuthenticationPrincipal String principal
    );

    @Operation(summary = "내 계정 정보 조회")
    @GetMapping("/me")
    ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal String principal);

    @Operation(summary = "계좌 조회")
    @GetMapping("/me/account")
    ResponseEntity<ApiResponse<AccountRegisterResponse>> getAccount(
            String principal);
}