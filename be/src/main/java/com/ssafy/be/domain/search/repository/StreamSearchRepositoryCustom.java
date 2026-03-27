package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.search.dto.SellerSearchRow;
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
                sel.id          AS seller_id,
                sel.shop_name,
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
