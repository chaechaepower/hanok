package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.search.dto.StreamSearchRow;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class StreamSearchRepositoryCustom {

    private final EntityManager em;
    private final RedisTemplate<String, String> redisTemplate; // 추가

    private static final String BASE_FROM = """
            FROM stream s
            JOIN seller sel ON s.seller_id = sel.id
            JOIN user u     ON sel.user_id  = u.id
            """;

    // Fix 1: viewer_count 제거 / Fix 2: id alias 추가
    private static final String SELECT_COLUMNS = """
            SELECT
                s.id            AS stream_id,
                s.title,
                s.thumbnail,
                s.status,
                s.scheduled_at,
                s.category,
                u.id            AS seller_user_id,
                u.nickname,
                u.profile_image_uri
            """;

    public List<StreamSearchRow> searchByStreamTitle(String keyword) {
        String sql = SELECT_COLUMNS + BASE_FROM +
                "WHERE MATCH(s.title) AGAINST(:keyword IN BOOLEAN MODE)";
        return executeSearch(sql, keyword);
    }

    public List<StreamSearchRow> searchByItemName(String keyword) {
        String sql = SELECT_COLUMNS + """
                FROM stream s
                JOIN seller sel ON s.seller_id = sel.id
                JOIN user u     ON sel.user_id  = u.id
                JOIN auction a  ON a.stream_id  = s.id
                JOIN item i     ON a.item_id    = i.id
                WHERE MATCH(i.name) AGAINST(:keyword IN BOOLEAN MODE)
                """;
        return executeSearch(sql, keyword);
    }

    public List<StreamSearchRow> searchByTagName(String keyword) {
        String sql = SELECT_COLUMNS + """
                FROM stream s
                JOIN seller sel ON s.seller_id = sel.id
                JOIN user u     ON sel.user_id  = u.id
                JOIN auction a  ON a.stream_id  = s.id
                JOIN item i     ON a.item_id    = i.id
                JOIN tag t      ON t.item_id    = i.id
                WHERE MATCH(t.name) AGAINST(:keyword IN BOOLEAN MODE)
                """;
        return executeSearch(sql, keyword);
    }

    @SuppressWarnings("unchecked")
    private List<StreamSearchRow> executeSearch(String sql, String keyword) {
        List<Object[]> rows = em.createNativeQuery(
                        "SELECT DISTINCT sub.* FROM (" + sql + ") sub")
                .setParameter("keyword", keyword)
                .getResultList();

        List<Long> streamIds = rows.stream()
                .map(r -> toLong(r[0]))
                .toList();

        Map<Long, Integer> viewerCounts = fetchViewerCountsBatch(streamIds);

        return rows.stream()
                .map(r -> {
                    Long streamId = toLong(r[0]);  // 재사용을 위해 추출
                    return StreamSearchRow.builder()
                            .streamId(streamId)
                            .title((String) r[1])
                            .thumbnail((String) r[2])
                            .status((String) r[3])
                            .scheduledAt(toLocalDateTime(r[4]))
                            .viewerCount(viewerCounts.getOrDefault(streamId, 0))
                            .category((String) r[5])
                            .sellerId(toLong(r[6]))
                            .sellerNickname((String) r[7])
                            .sellerProfileImageUri((String) r[8])
                            .build();
                })
                .toList();
    }

    // Fix 3: Redis 일괄 조회, 키 없으면 0 반환
    private Map<Long, Integer> fetchViewerCountsBatch(List<Long> streamIds) {
        if (streamIds.isEmpty()) return Map.of();

        List<String> keys = streamIds.stream()
                .map(id -> "stream:viewer:" + id)  // 기존 Redis 키 패턴에 맞게 조정
                .toList();

        List<String> values = redisTemplate.opsForValue().multiGet(keys);
        Map<Long, Integer> result = new HashMap<>();

        for (int i = 0; i < streamIds.size(); i++) {
            String val = (values != null) ? values.get(i) : null;
            result.put(streamIds.get(i), val != null ? Integer.parseInt(val) : 0);
        }
        return result;
    }

    private Long toLong(Object o) {
        return o != null ? ((Number) o).longValue() : null;
    }

    private LocalDateTime toLocalDateTime(Object o) {
        if (o == null) return null;
        if (o instanceof LocalDateTime ldt) return ldt;
        if (o instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
        return null;
    }
}
