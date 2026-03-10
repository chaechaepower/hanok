package com.ssafy.be.domain.chat.dto.payload;


import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ChatMessagePayload(
   Long streamId,
   Long userId,
   String nickname,
   String content,
   LocalDateTime createdAt
) {}
