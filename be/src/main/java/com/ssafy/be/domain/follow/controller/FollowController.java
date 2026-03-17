package com.ssafy.be.domain.follow.controller;

import com.ssafy.be.domain.follow.controller.api.FollowApi;
import com.ssafy.be.domain.follow.dto.response.FollowItemResponse;
import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.dto.response.PageResponse;
import com.ssafy.be.domain.follow.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FollowController implements FollowApi {

    private final FollowService followService;

    @Override
    @PostMapping("/follow/{targetSellerId}")
    public ResponseEntity<FollowResponse> toggleFollow(
            @PathVariable Long targetSellerId,
            @AuthenticationPrincipal String principal
    ) {
        return ResponseEntity.ok(
                followService.toggleFollow(Long.parseLong(principal), targetSellerId)
        );
    }

    @Override
    @GetMapping("/following")
    public ResponseEntity<PageResponse<FollowItemResponse>> getFollowingList(
            @AuthenticationPrincipal String principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                followService.getFollowingList(Long.parseLong(principal), pageable)
        );
    }
}
