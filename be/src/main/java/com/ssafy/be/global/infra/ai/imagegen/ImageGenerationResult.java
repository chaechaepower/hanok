package com.ssafy.be.global.infra.ai.imagegen;


public record ImageGenerationResult(
        byte[] bytes,
        String mimeType
) {
}
