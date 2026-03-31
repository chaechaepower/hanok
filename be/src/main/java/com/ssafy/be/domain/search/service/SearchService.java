package com.ssafy.be.domain.search.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.search.dto.SellerSearchRow;
import com.ssafy.be.domain.search.dto.StreamSearchRow;
import com.ssafy.be.domain.search.dto.response.MatchReason;
import com.ssafy.be.domain.search.dto.response.MatchType;
import com.ssafy.be.domain.search.dto.response.SellerInfo;
import com.ssafy.be.domain.search.dto.response.SellerSearchResult;
import com.ssafy.be.domain.search.dto.response.StreamSearchPage;
import com.ssafy.be.domain.search.dto.response.StreamSearchResult;
import com.ssafy.be.domain.search.repository.StreamSearchRepositoryCustom;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.service.StreamViewerService;
import com.ssafy.be.global.infra.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final long SEARCH_CACHE_TTL_SECONDS = 60L;

    private final StreamSearchRepositoryCustom searchRepository;
    private final StreamViewerService streamViewerService;
    private final FollowRepository followRepository;
    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public StreamSearchPage search(String keyword, int page, int size) {
        String safeKeyword = keyword.trim()
                .replaceAll("[+\\-><()~*\"@]", " ").trim();

        if (safeKeyword.isEmpty()) return StreamSearchPage.builder()
                .data(new ArrayList<>()).page(page).size(size).totalCount(0).build();

        String cacheKey = "search:" + safeKeyword + ":" + page + ":" + size;
        String cached = redisService.get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, StreamSearchPage.class);
            } catch (Exception e) {
                log.warn("search cache deserialize 실패, DB 조회로 fallback. key={}", cacheKey);
            }
        }

        int perQueryLimit = (page + 1) * size;

        List<StreamSearchRow> rows = searchRepository.searchUnion(safeKeyword, perQueryLimit);

        Map<Long, StreamSearchResult> resultMap = new LinkedHashMap<>();
        for (StreamSearchRow row : rows) {
            StreamSearchResult result = resultMap.computeIfAbsent(row.streamId(), id -> toResult(row));
            MatchReason reason = switch (row.matchType()) {
                case "ITEM_NAME" -> MatchReason.builder()
                        .type(MatchType.ITEM_NAME).matchedValue(safeKeyword).build();
                case "TAG" -> MatchReason.builder()
                        .type(MatchType.TAG).matchedValue("#" + safeKeyword).build();
                default -> MatchReason.builder()
                        .type(MatchType.STREAM_TITLE).matchedValue(row.title()).build();
            };
            if (result.matchReasons().stream().noneMatch(r -> r.type() == reason.type())) {
                result.addReason(reason);
            }
        }

        List<StreamSearchResult> merged = new ArrayList<>(resultMap.values());
        int totalCount = merged.size();
        int from = page * size;
        List<StreamSearchResult> paged = from >= totalCount
                ? new ArrayList<>()
                : merged.subList(from, Math.min(from + size, totalCount));

        StreamSearchPage result = StreamSearchPage.builder()
                .data(paged).page(page).size(size).totalCount(totalCount).build();

        try {
            redisService.save(cacheKey, objectMapper.writeValueAsString(result),
                    SEARCH_CACHE_TTL_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("search cache 저장 실패. key={}", cacheKey);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<SellerSearchResult> searchSellers(String keyword, Long userId) {
        String safeKeyword = keyword.trim()
                .replaceAll("[+\\-><()~*\"@]", " ").trim();

        if (safeKeyword.isEmpty()) return new ArrayList<>();

        List<SellerSearchRow> rows = searchRepository.searchByShopName(safeKeyword);

        Set<Long> followedSellerIds = userId != null
                ? followRepository.findFollowedSellerIdsByUserId(userId)
                : Set.of();

        return rows.stream()
                .map(row -> toSellerResult(row, followedSellerIds))
                .toList();
    }

    private SellerSearchResult toSellerResult(SellerSearchRow row, Set<Long> followedSellerIds) {
        long total = row.completedTrades() + row.penaltyCount();
        double rating = total == 0 ? 5.0
                : Math.round(row.completedTrades() * 5.0 / total * 100.0) / 100.0;
        return SellerSearchResult.builder()
                .sellerId(row.sellerId())
                .shopName(row.shopName())
                .profileImage(row.profileImage())
                .intro(row.intro())
                .rating(rating)
                .isFollowed(followedSellerIds.contains(row.sellerId()))
                .build();
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
                        .nickname(row.shopName())
                        .profileImageUri(row.sellerProfileImageUri())
                        .build())
                .matchReasons(new ArrayList<>())
                .build();
    }
}
