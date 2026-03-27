package com.ssafy.be.global.infra.ai.prompt;

import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

@Component
public class StreamThumbnailPromptRenderer {

    @Value("${ai.prompts.stream-thumbnail-prompt}")
    private Resource promptTemplate;

    private String prompt;

    @PostConstruct
    public void init() {
        try (InputStream is = promptTemplate.getInputStream()) {
            this.prompt = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("프롬프트를 불러오는데 실패했습니다.", e);
        }
    }

    public String render(StreamRegisterRequest request, Seller seller) {
        return prompt
                .replace("{stream_info}", request.describe())
                .replace("{seller_info}", seller.describe());
    }
}
