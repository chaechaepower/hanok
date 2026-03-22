package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.search.dto.StreamSearchRow;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class StreamSearchRepositoryCustom {

    private final EntityManager em;

    private static final String BASE_FROM = """
            FROM stream s
            JOIN seller sel ON s.seller_id = sel.id
            JOIN user u     ON sel.user_id  = u.id
            """;

    private static final String ACTIVE_STATUS_FILTER =
            "AND s.status IN ('LIVE', 'SCHEDULED') ";

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
                u.profile_image
            """;

    public List<StreamSearchRow> searchByStreamTitle(String keyword) {
        String sql = SELECT_COLUMNS + BASE_FROM +
                "WHERE MATCH(s.title) AGAINST(:keyword IN BOOLEAN MODE) "
                + ACTIVE_STATUS_FILTER;
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
                """ + ACTIVE_STATUS_FILTER;
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
                """ + ACTIVE_STATUS_FILTER;  // ✅ 추가
        return executeSearch(sql, keyword);
    }

    @SuppressWarnings("unchecked")
    private List<StreamSearchRow> executeSearch(String sql, String keyword) {
        List<Object[]> rows = em.createNativeQuery(
                        "SELECT DISTINCT sub.* FROM (" + sql + ") sub")
                .setParameter("keyword", keyword)
                .getResultList();

        return rows.stream()
                .map(r -> StreamSearchRow.builder()
                        .streamId(toLong(r[0]))
                        .title((String) r[1])
                        .thumbnail((String) r[2])
                        .status((String) r[3])
                        .scheduledAt(toLocalDateTime(r[4]))
                        .category((String) r[5])
                        .sellerId(toLong(r[6]))
                        .sellerNickname((String) r[7])
                        .sellerProfileImageUri((String) r[8])
                        .build())
                .toList();
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
