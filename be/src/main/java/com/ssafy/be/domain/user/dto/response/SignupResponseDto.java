package com.ssafy.be.domain.user.dto.response;

import com.ssafy.be.domain.user.entity.User;
import lombok.Builder;

// [DTO - Response Layer]
// Record 사용 - 불변 객체, getter 자동 생성 (userId(), email(), nickname() 형태)
// Entity를 직접 반환하지 않고 DTO로 변환해서 반환 (불필요한 정보 노출 방지)
@Builder
public record SignupResponseDto(
        Long userId,
        String email,
        String nickname
) {
    // Entity → DTO 변환 메서드
    public static SignupResponseDto fromEntity(User user) {
        return SignupResponseDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .build();
    }
}