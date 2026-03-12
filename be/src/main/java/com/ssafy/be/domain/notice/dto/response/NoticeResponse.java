package com.ssafy.be.domain.notice.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record NoticeResponse(
        Long noticeId,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
