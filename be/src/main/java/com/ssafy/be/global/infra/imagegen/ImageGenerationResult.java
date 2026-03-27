package com.ssafy.be.global.infra.imagegen;

/**
 * 이미지 생성 API에서 내려준 바이너리와 MIME 타입.
 */
public record ImageGenerationResult(byte[] bytes, String mimeType) {}
