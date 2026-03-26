package com.ssafy.be.domain.search.service;

import com.ssafy.be.domain.search.dto.StreamSearchRow;
import com.ssafy.be.domain.search.dto.response.MatchReason;
import com.ssafy.be.domain.search.dto.response.MatchType;
import com.ssafy.be.domain.search.dto.response.SellerInfo;
import com.ssafy.be.domain.search.dto.response.StreamSearchResult;
import com.ssafy.be.domain.search.repository.StreamSearchRepositoryCustom;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.service.StreamViewerService; // ✅ import 추가
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final StreamSearchRepositoryCustom searchRepository;
    private final StreamViewerService streamViewerService;

    @Transactional(readOnly = true)
    public List<StreamSearchResult> search(String keyword) {
        String trimmed = keyword.trim();

        // IN BOOLEAN MODE 특수기호 처리
        String safeKeyword = trimmed.replaceAll("[+\\-><()~*\"@]", " ").trim();

        if (safeKeyword.isEmpty()) {
            return new ArrayList<>();
        }

        // 방송 -> 아이템 -> 태그 순서 보장
        Map<Long, StreamSearchResult> resultMap = new LinkedHashMap<>();

        // 1. 방송 제목 검색
        searchRepository.searchByStreamTitle(safeKeyword)
                .forEach(row -> resultMap
                        .computeIfAbsent(row.streamId(), id -> toResult(row))
                        .addReason(MatchReason.builder()
                                .type(MatchType.STREAM_TITLE)
                                .matchedValue(row.title())
                                .build()));

        // 2. 아이템 이름 검색
        searchRepository.searchByItemName(safeKeyword)
                .forEach(row -> resultMap
                        .computeIfAbsent(row.streamId(), id -> toResult(row))
                        .addReason(MatchReason.builder()
                                .type(MatchType.ITEM_NAME)
                                .matchedValue(safeKeyword)
                                .build()));

        // 3. 태그 검색
        searchRepository.searchByTagName(safeKeyword)
                .forEach(row -> resultMap
                        .computeIfAbsent(row.streamId(), id -> toResult(row))
                        .addReason(MatchReason.builder()
                                .type(MatchType.TAG)
                                .matchedValue("#" + safeKeyword)
                                .build()));

        return new ArrayList<>(resultMap.values());
    }

    private StreamSearchResult toResult(StreamSearchRow row) {
        //SCHEDULED 상태는 시청자 없으니 0으로 처리
        StreamStatus status = row.status() != null ? StreamStatus.valueOf(row.status()) : null;
        return StreamSearchResult.builder()
                .streamId(row.streamId())
                .title(row.title())
                .thumbnail(row.thumbnail())
                .status(status)
                .scheduledAt(row.scheduledAt())
                .viewerCount(status == StreamStatus.LIVE
                        ? (int) streamViewerService.getViewerCount(row.streamId())
                        : 0)
                .category(row.category())
                .seller(SellerInfo.builder()
                        .sellerId(row.sellerId())
                        .nickname(row.sellerNickname())
                        .profileImageUri(row.sellerProfileImageUri())
                        .build())
                .matchReasons(new ArrayList<>())
                .build();
    }
}
