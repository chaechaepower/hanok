package com.ssafy.be.domain.follow.controller.api;

import com.ssafy.be.domain.follow.dto.response.FollowItemResponse;
import com.ssafy.be.domain.follow.dto.response.FollowResponse;
import com.ssafy.be.domain.follow.dto.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "Follow", description = "팔로우 API")
public interface FollowApi {

    @Operation(summary = "팔로우 / 언팔로우 토글", description = "판매자를 팔로우하거나 언팔로우합니다.")
    @ApiResponse(responseCode = "200", description = "토글 성공")
    @ApiResponse(responseCode = "400", description = "자기 자신 팔로우 불가")
    @ApiResponse(responseCode = "404", description = "사용자 또는 판매자를 찾을 수 없음")
    ResponseEntity<FollowResponse> toggleFollow(Long targetUserId, String principal);

    @Operation(summary = "팔로잉 목록 조회", description = "본인이 팔로우한 판매자 목록을 페이징 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    ResponseEntity<PageResponse<FollowItemResponse>> getFollowingList(
            String principal, int page, int size);
}
