package com.ssafy.be.domain.user.controller;

import com.ssafy.be.domain.user.controller.api.UserProfileApi;
import com.ssafy.be.domain.user.service.UserService;
import com.ssafy.be.global.common.response.ApiResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserProfileController implements UserProfileApi {

    private final UserService userService;

    // -----------------------------------------------
    // 프로필 이미지 업로드
    // PATCH /api/v1/users/me/profile-image
    // -----------------------------------------------
    @Override
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            @RequestPart("image") MultipartFile file,
            @AuthenticationPrincipal Long userId) throws IOException {

        String imageUrl = userService.uploadProfileImage(userId, file);
        return ResponseEntity.ok(ApiResponse.success(imageUrl));
    }
}