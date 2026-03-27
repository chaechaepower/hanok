package com.ssafy.be.global.infra.imagegen;

public interface ImageGenClient {

    ImageGenerationResult generateImageFrom(String prompt);
}
