package com.ssafy.be.domain.search.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.search.dto.SellerSearchRow;
import com.ssafy.be.domain.search.dto.StreamSearchRow;
import com.ssafy.be.domain.search.dto.response.AutocompleteSuggestion;
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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final long SEARCH_CACHE_TTL_SECONDS = 60L;

    private final ExecutorService searchExecutor =
            Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() * 2);

    private final StreamSearchRepositoryCustom searchRepository;
    private final StreamViewerService streamViewerService;
    private final FollowRepository followRepository;
    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public StreamSearchPage search(String keyword, int page, int size) {
        String safeKeyword = keyword.trim();
        if (safeKeyword.isEmpty()) return StreamSearchPage.builder()
                .data(new ArrayList<>()).page(page).size(size).totalCount(0).build();

        int limit = (page + 1) * size;

        CompletableFuture<List<StreamSearchRow>> titleFuture =
                CompletableFuture.supplyAsync(
                        () -> searchRepository.searchByStreamTitle(safeKeyword, limit), searchExecutor);
        CompletableFuture<List<StreamSearchRow>> itemFuture =
                CompletableFuture.supplyAsync(
                        () -> searchRepository.searchByItemName(safeKeyword, limit), searchExecutor);
        CompletableFuture<List<StreamSearchRow>> tagFuture =
                CompletableFuture.supplyAsync(
                        () -> searchRepository.searchByTagName(safeKeyword, limit), searchExecutor);

        List<StreamSearchRow> byTitle, byItem, byTag;
        try {
            byTitle = titleFuture.get();
            byItem  = itemFuture.get();
            byTag   = tagFuture.get();
        } catch (Exception e) {
            throw new RuntimeException("병렬 검색 실패", e);
        }

        Map<Long, StreamSearchResult> resultMap = new LinkedHashMap<>();
        for (StreamSearchRow row : byTitle) resultMap.computeIfAbsent(row.streamId(), id -> toResult(row));
        for (StreamSearchRow row : byItem)  resultMap.computeIfAbsent(row.streamId(), id -> toResult(row));
        for (StreamSearchRow row : byTag)   resultMap.computeIfAbsent(row.streamId(), id -> toResult(row));

        List<StreamSearchResult> merged = new ArrayList<>(resultMap.values());
        int totalCount = merged.size();
        int from = page * size;
        List<StreamSearchResult> paged = from >= totalCount
                ? new ArrayList<>()
                : merged.subList(from, Math.min(from + size, totalCount));

        return StreamSearchPage.builder()
                .data(paged).page(page).size(size).totalCount(totalCount).build();
    }

    @Transactional(readOnly = true)
    public List<SellerSearchResult> searchSellers(String keyword, Long userId) {
        String safeKeyword = keyword.trim()
                .replaceAll("[+\\-><()~*\"@]", " ").trim();

        if (safeKeyword.isEmpty()) return new ArrayList<>();

        String cacheKey = "search:seller:" + safeKeyword;
        List<SellerSearchRow> rows = null;

        String cached = redisService.get(cacheKey);
        if (cached != null) {
            try {
                rows = objectMapper.readValue(cached,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, SellerSearchRow.class));
            } catch (Exception e) {
                log.warn("seller search cache deserialize 실패, DB 조회로 fallback. key={}", cacheKey);
            }
        }

        if (rows == null) {
            rows = searchRepository.searchByShopName(safeKeyword);
            try {
                redisService.save(cacheKey, objectMapper.writeValueAsString(rows),
                        SEARCH_CACHE_TTL_SECONDS, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("seller search cache 저장 실패. key={}", cacheKey);
            }
        }

        Set<Long> followedSellerIds = userId != null
                ? followRepository.findFollowedSellerIdsByUserId(userId)
                : Set.of();

        return rows.stream()
                .map(row -> toSellerResult(row, followedSellerIds))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AutocompleteSuggestion> autocomplete(String keyword, int limit) {
        String safeKeyword = keyword.trim()
                .replaceAll("[+\\-><()~*\"@]", " ").trim();

        if (safeKeyword.isEmpty()) return new ArrayList<>();

        String cacheKey = "search:autocomplete:" + safeKeyword + ":" + limit;
        String cached = redisService.get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, AutocompleteSuggestion.class));
            } catch (Exception e) {
                log.warn("autocomplete cache deserialize 실패, DB 조회로 fallback. key={}", cacheKey);
            }
        }

        List<AutocompleteSuggestion> suggestions = searchRepository.searchAutocomplete(safeKeyword, limit);
        try {
            redisService.save(cacheKey, objectMapper.writeValueAsString(suggestions), 30L, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("autocomplete cache 저장 실패. key={}", cacheKey);
        }
        return suggestions;
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
