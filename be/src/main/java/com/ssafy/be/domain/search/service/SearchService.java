package com.ssafy.be.domain.search.service;

import com.ssafy.be.domain.search.dto.response.MatchReason;
import com.ssafy.be.domain.search.dto.response.MatchType;
import com.ssafy.be.domain.search.dto.response.StreamSearchResult;
import com.ssafy.be.domain.search.repository.StreamSearchRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final StreamSearchRepository searchRepository;

    public List<StreamSearchResult> search(String keyword) {
        String trimmed = keyword.trim();

        // IN BOOLEAN MODE에서는 특수기호 연산자로 취급 -> 처리필요
        String safeKeyword = trimmed.replaceAll("[+\\-><()~*\"@]", " ").trim();

        if (safeKeyword.isEmpty()) {
            return new ArrayList<>();
        }

        // 방송 -> 아이템 -> 태그 순의 key 순서 보장을 위해 linkedhashmap
        Map<Long, StreamSearchResult> resultMap = new LinkedHashMap<>();


        // 1. 방송 이름 검색
        searchRepository.searchByStreamTitle(trimmed)
                .forEach(s -> resultMap
                        .computeIfAbsent(s.getId(), id -> toResult(s))
                        .addReason(MatchReason.builder()
                                .type(MatchType.STREAM_TITLE)
                                .matchedValue(s.getTitle())
                                .build()));

        // 2. 아이템 검색
        searchRepository.searchByItemName(trimmed)
                .forEach(s -> resultMap
                        .computeIfAbsent(s.getId(), id -> toResult(s))
                        .addReason(MatchReason.builder()
                                .type(MatchType.ITEM_NAME)
                                .matchedValue(trimmed)
                                .build()));

        searchRepository.searchByTagName(trimmed)
                .forEach(s -> resultMap
                        .computeIfAbsent(s.getId(), id -> toResult(s))
                        .addReason(MatchReason.builder()
                                .type(MatchType.TAG)
                                .matchedValue("#" + trimmed)
                                .build()));

        return new ArrayList<>(resultMap.values());

    }

    private StreamSearchResult toResult(Stream s) {
        return StreamSearchResult.builder()
                .streamId(s.getId())
                .title(s.getTitle())
                .thumbnail(s.getThumbnail())
                .status(s.getStatus())
                .matchReasons(new ArrayList<>())
                .build();
    }
}
