package com.ssafy.be.global.infra.imagegen.gemini;

import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.infra.imagegen.ImageGenClient;
import com.ssafy.be.global.infra.imagegen.ImageGenerationResult;

import java.net.URI;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import static com.ssafy.be.global.infra.imagegen.exception.ImageGenErrorCode.IMAGE_GENERATION_FAILED;
import static com.ssafy.be.global.infra.imagegen.gemini.GeminiGenerateContentModels.InlineDataOut;
import static com.ssafy.be.global.infra.imagegen.gemini.GeminiGenerateContentModels.PartOut;
import static com.ssafy.be.global.infra.imagegen.gemini.GeminiGenerateContentModels.Request;

@Component
public class GeminiImageGenClient implements ImageGenClient {

    private final RestClient restClient;
    private final String generateContentUrl;

    public GeminiImageGenClient(
            @Value("${gms.api-key}") String gmsApiKey,
            @Value("${gms.image-generation.generate-content-url}") String imageGenerationUrl
    ) {
        this.generateContentUrl = imageGenerationUrl;
        this.restClient = RestClient.builder()
                .defaultHeader("x-goog-api-key", gmsApiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public ImageGenerationResult generateImageFrom(String prompt) {
        GeminiGenerateContentModels.Response response = restClient
                .post()
                .uri(URI.create(generateContentUrl))
                .body(Request.textToImage(prompt))
                .retrieve()
                .body(GeminiGenerateContentModels.Response.class);

        InlineDataOut image = extractFirstInlineImage(response);

        if (image == null || !StringUtils.hasText(image.data())) {
            throw new GlobalException(IMAGE_GENERATION_FAILED);
        }

        String mimeType = image.mimeType();
        byte[] bytes = Base64.getDecoder().decode(image.data());

        return new ImageGenerationResult(bytes, mimeType);
    }

    private static InlineDataOut extractFirstInlineImage(GeminiGenerateContentModels.Response response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            return null;
        }

        for (var candidate : response.candidates()) {
            if (candidate == null || candidate.content() == null || candidate.content().parts() == null) {
                continue;
            }

            for (PartOut part : candidate.content().parts()) {
                if (part != null && part.inlineData() != null && StringUtils.hasText(part.inlineData().data())) {
                    return part.inlineData();
                }
            }
        }

        return null;
    }
}
