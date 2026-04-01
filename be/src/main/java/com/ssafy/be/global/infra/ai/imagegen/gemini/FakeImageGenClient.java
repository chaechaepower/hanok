package com.ssafy.be.global.infra.ai.imagegen.gemini;

import com.ssafy.be.global.infra.ai.imagegen.ImageGenClient;
import com.ssafy.be.global.infra.ai.imagegen.ImageGenerationResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicReference;

@Primary
@Service
public class FakeImageGenClient implements ImageGenClient {

    private final AtomicReference<ImageGenerationResult> dummyOverride = new AtomicReference<>();
    private final long latencyMs;

    public FakeImageGenClient(
            @Value("${ai.image-generation.fake.latency-ms:5000}") long latencyMs) {
        this.latencyMs = latencyMs;
    }

    /**
     * Forces {@link #generateImage(String)} to return this result until {@link #resetDummyGenerationResult()}.
     * Use in Spring tests that load this bean (e.g. {@code @Autowired FakeImageGenClient fake}).
     */
    public void setDummyGenerationResult(ImageGenerationResult result) {
        dummyOverride.set(result);
    }

    public void resetDummyGenerationResult() {
        dummyOverride.set(null);
    }

    @Override
    public ImageGenerationResult generateImage(String prompt) {
        if (latencyMs > 0) {
            try {
                Thread.sleep(latencyMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        ImageGenerationResult overridden = dummyOverride.get();
        if (overridden != null) {
            return overridden;
        }
        return ImageGenerationResult.dummyPng();
    }
}
