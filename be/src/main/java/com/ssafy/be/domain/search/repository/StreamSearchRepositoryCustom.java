package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.search.dto.SellerSearchRow;
import com.ssafy.be.domain.search.dto.StreamSearchRow;
import com.ssafy.be.domain.search.dto.response.AutocompleteSuggestion;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class StreamSearchRepositoryCustom {

    private final EntityManager em;

    public List<StreamSearchRow> searchByStreamTitle(String keyword, int limit) {
        String sql = """
                SELECT s.id AS stream_id, s.title, s.thumbnail, s.status,
                       s.scheduled_at, s.category,
                       sel.id AS seller_id, sel.shop_name, u.profile_image
                FROM stream s
                JOIN seller sel ON s.seller_id = sel.id
                JOIN user u     ON sel.user_id  = u.id
                WHERE MATCH(s.title) AGAINST(:keyword IN BOOLEAN MODE)
                AND s.status IN ('LIVE','SCHEDULED')
                LIMIT :lim
                """;
        return executeSearchFT(sql, keyword, limit);
    }

    public List<StreamSearchRow> searchByItemName(String keyword, int limit) {
        String sql = """
                SELECT s.id AS stream_id, s.title, s.thumbnail, s.status,
                       s.scheduled_at, s.category,
                       sel.id AS seller_id, sel.shop_name, u.profile_image
                FROM stream s
                JOIN seller sel ON s.seller_id = sel.id
                JOIN user u     ON sel.user_id  = u.id
                JOIN auction a  ON a.stream_id  = s.id
                JOIN item i     ON a.item_id    = i.id
                WHERE MATCH(i.name) AGAINST(:keyword IN BOOLEAN MODE)
                AND s.status IN ('LIVE','SCHEDULED')
                LIMIT :lim
                """;
        return executeSearchFT(sql, keyword, limit);
    }

    public List<StreamSearchRow> searchByTagName(String keyword, int limit) {
        String sql = """
                SELECT s.id AS stream_id, s.title, s.thumbnail, s.status,
                       s.scheduled_at, s.category,
                       sel.id AS seller_id, sel.shop_name, u.profile_image
                FROM stream s
                JOIN seller sel ON s.seller_id = sel.id
                JOIN user u     ON sel.user_id  = u.id
                JOIN auction a  ON a.stream_id  = s.id
                JOIN item i     ON a.item_id    = i.id
                JOIN tag t      ON t.item_id    = i.id
                WHERE MATCH(t.name) AGAINST(:keyword IN BOOLEAN MODE)
                AND s.status IN ('LIVE','SCHEDULED')
                LIMIT :lim
                """;
        return executeSearchFT(sql, keyword, limit);
    }

    @SuppressWarnings("unchecked")
    public List<StreamSearchRow> searchUnion(String keyword, int perQueryLimit) {
        String sql = """
                (SELECT s.id AS stream_id, s.title, s.thumbnail, s.status,
                        s.scheduled_at, s.category,
                        sel.id AS seller_id, sel.shop_name, u.profile_image,
                        MATCH(s.title) AGAINST(:keyword IN BOOLEAN MODE) AS score,
                        'STREAM_TITLE' AS match_type
                 FROM stream s
                 JOIN seller sel ON s.seller_id = sel.id
                 JOIN user u     ON sel.user_id  = u.id
                 WHERE MATCH(s.title) AGAINST(:keyword IN BOOLEAN MODE)
                 AND s.status IN ('LIVE', 'SCHEDULED')
                 LIMIT :lim)
                UNION ALL
                (SELECT s.id AS stream_id, s.title, s.thumbnail, s.status,
                        s.scheduled_at, s.category,
                        sel.id AS seller_id, sel.shop_name, u.profile_image,
                        MATCH(i.name) AGAINST(:keyword IN BOOLEAN MODE) AS score,
                        'ITEM_NAME' AS match_type
                 FROM stream s
                 JOIN seller sel ON s.seller_id = sel.id
                 JOIN user u     ON sel.user_id  = u.id
                 JOIN auction a  ON a.stream_id  = s.id
                 JOIN item i     ON a.item_id    = i.id
                 WHERE MATCH(i.name) AGAINST(:keyword IN BOOLEAN MODE)
                 AND s.status IN ('LIVE', 'SCHEDULED')
                 LIMIT :lim)
                UNION ALL
                (SELECT s.id AS stream_id, s.title, s.thumbnail, s.status,
                        s.scheduled_at, s.category,
                        sel.id AS seller_id, sel.shop_name, u.profile_image,
                        MATCH(t.name) AGAINST(:keyword IN BOOLEAN MODE) AS score,
                        'TAG' AS match_type
                 FROM stream s
                 JOIN seller sel ON s.seller_id = sel.id
                 JOIN user u     ON sel.user_id  = u.id
                 JOIN auction a  ON a.stream_id  = s.id
                 JOIN item i     ON a.item_id    = i.id
                 JOIN tag t      ON t.item_id    = i.id
                 WHERE MATCH(t.name) AGAINST(:keyword IN BOOLEAN MODE)
                 AND s.status IN ('LIVE', 'SCHEDULED')
                 LIMIT :lim)
                """;

        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("keyword", keyword)
                .setParameter("lim", perQueryLimit)
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
                        .shopName((String) r[7])
                        .sellerProfileImageUri((String) r[8])
                        .score(r[9] != null ? ((Number) r[9]).doubleValue() : 0.0)
                        .matchType((String) r[10])
                        .build())
                .toList();
    }

    @SuppressWarnings("unchecked")
    public List<AutocompleteSuggestion> searchAutocomplete(String keyword, int limit) {
        String sql = """
                (SELECT s.title AS text, 'STREAM_TITLE' AS type
                 FROM stream s
                 WHERE MATCH(s.title) AGAINST(:keyword IN BOOLEAN MODE)
                 AND s.status IN ('LIVE', 'SCHEDULED')
                 LIMIT :lim)
                UNION ALL
                (SELECT DISTINCT i.name AS text, 'ITEM_NAME' AS type
                 FROM item i
                 JOIN auction a  ON a.item_id   = i.id
                 JOIN stream s   ON a.stream_id = s.id
                 WHERE MATCH(i.name) AGAINST(:keyword IN BOOLEAN MODE)
                 AND s.status IN ('LIVE', 'SCHEDULED')
                 LIMIT :lim)
                UNION ALL
                (SELECT DISTINCT t.name AS text, 'TAG' AS type
                 FROM tag t
                 JOIN item i     ON t.item_id   = i.id
                 JOIN auction a  ON a.item_id   = i.id
                 JOIN stream s   ON a.stream_id = s.id
                 WHERE MATCH(t.name) AGAINST(:keyword IN BOOLEAN MODE)
                 AND s.status IN ('LIVE', 'SCHEDULED')
                 LIMIT :lim)
                """;

        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("keyword", keyword)
                .setParameter("lim", limit)
                .getResultList();

        return rows.stream()
                .map(r -> AutocompleteSuggestion.builder()
                        .text((String) r[0])
                        .type((String) r[1])
                        .build())
                .toList();
    }

    @SuppressWarnings("unchecked")
    public List<SellerSearchRow> searchByShopName(String keyword) {
        String sql = """
                SELECT
                    sel.id            AS seller_id,
                    sel.shop_name,
                    u.profile_image,
                    sel.intro,
                    sel.penalty_count,
                    COUNT(DISTINCT CASE WHEN tr.trade_type = 'SETTLEMENT' AND tr.amount > 0 THEN tr.id END) AS completed_trades
                FROM seller sel
                JOIN user u        ON u.id       = sel.user_id
                LEFT JOIN trade_report tr ON tr.user_id = sel.user_id
                WHERE sel.shop_name LIKE CONCAT('%', :keyword, '%')
                GROUP BY sel.id, sel.shop_name, u.profile_image, sel.intro, sel.penalty_count
                """;

        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("keyword", keyword)
                .getResultList();

        return rows.stream()
                .map(r -> SellerSearchRow.builder()
                        .sellerId(toLong(r[0]))
                        .shopName((String) r[1])
                        .profileImage((String) r[2])
                        .intro((String) r[3])
                        .penaltyCount(r[4] != null ? ((Number) r[4]).intValue() : 0)
                        .completedTrades(r[5] != null ? ((Number) r[5]).longValue() : 0L)
                        .build())
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<StreamSearchRow> executeSearchFT(String sql, String keyword, int limit) {
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("keyword", keyword)   // % 없음 — FULLTEXT에는 불필요
                .setParameter("lim", limit)
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
                        .shopName((String) r[7])
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
