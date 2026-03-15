package com.ssafy.be.domain.user.controller;

import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.service.FollowService;
import com.ssafy.be.domain.seller.dto.response.SellerStatusResponse;
import com.ssafy.be.domain.seller.service.SellerService;
import com.ssafy.be.domain.user.controller.api.UserProfileApi;
import com.ssafy.be.domain.user.dto.request.AccountRegisterRequest;
import com.ssafy.be.domain.user.dto.response.AccountRegisterResponse;
import com.ssafy.be.domain.user.dto.response.UserProfileResponse;
import com.ssafy.be.domain.user.service.UserService;
import com.ssafy.be.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserProfileController implements UserProfileApi {

    private final UserService userService;
    private final FollowService followService;
    private final SellerService sellerService;

    @Override
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            @RequestPart("image") MultipartFile file,
            @AuthenticationPrincipal String principal) throws IOException {

        Long userId = getUserId(principal);
        String imageUrl = userService.uploadProfileImage(userId, file);
        return ResponseEntity.ok(ApiResponse.success(imageUrl));
    }

    @Override
    public ResponseEntity<ApiResponse<AccountRegisterResponse>> registerAccount(
            @AuthenticationPrincipal String principal,
            @RequestBody @Valid AccountRegisterRequest request) {

        Long userId = getUserId(principal);
        AccountRegisterResponse response = userService.registerAccount(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Override
    @PostMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<FollowResponse>> toggleFollow(
            @AuthenticationPrincipal String principal,
            @PathVariable("userId") Long targetUserId) {

        Long loginUserId = getUserId(principal);

        FollowResponse response = followService.toggleFollow(loginUserId, targetUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }

    @Override
    public ResponseEntity<ApiResponse<SellerStatusResponse>> getSellerStatus(
            @AuthenticationPrincipal String principal) {

        Long userId = getUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(sellerService.getSellerStatus(userId)));
    }

    @Override
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal String principal) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(userService.getMyProfile(userId)));
    }

    @Override
    public ResponseEntity<ApiResponse<AccountRegisterResponse>> getAccount(
            @AuthenticationPrincipal String principal) {
        Long userId = getUserId(principal);
        return ResponseEntity.ok(ApiResponse.success(userService.getAccount(userId)));
    }
}