package com.ssafy.be.global.infra.ai.imagegen;

public interface ImageGenClient {

    ImageGenerationResult generateImage(String prompt);
}
