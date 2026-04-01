package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.stream.dto.request.StreamRegisterRequest;
import com.ssafy.be.global.infra.ai.imagegen.ImageGenClient;
import com.ssafy.be.global.infra.ai.imagegen.ImageGenerationResult;
import com.ssafy.be.global.infra.ai.prompt.StreamThumbnailPromptRenderer;
import com.ssafy.be.global.infra.storage.gcs.GcsClient;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class ThumbnailAsyncService {
    private final ImageGenClient imageGenClient;
    private final StreamThumbnailPromptRenderer thumbnailPromptRenderer;
    private final GcsClient gcsClient;
    private final ThumbnailUpdateService thumbnailUpdateService;

    @Async("thumbnailExecutor")
    public void generateAndApplyThumbnail(Long streamId, StreamRegisterRequest request, Seller seller) {
        String prompt = thumbnailPromptRenderer.render(request, seller);
        ImageGenerationResult result = imageGenClient.generateImage(prompt);

        String fileName = "streams/" + streamId + "/thumbnail";
        String url = gcsClient.upload(result.bytes(), fileName);

        thumbnailUpdateService.update(streamId, url);
    }
}
