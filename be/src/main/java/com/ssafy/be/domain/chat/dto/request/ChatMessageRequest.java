package com.ssafy.be.domain.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        Long streamId,

        @NotBlank
        @Size(max = 500)
        String content
) {
}
