package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.stream.repository.StreamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class ThumbnailUpdateService {
    private final StreamRepository streamRepository;

    @Transactional
    public void update(Long streamId, String url) {
        streamRepository.findById(streamId)
                .ifPresent(stream -> stream.updateThumbnail(url));
    }
}
