package com.ssafy.be.domain.search.repository;

import com.ssafy.be.domain.search.dto.StreamSearchRow;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class StreamSearchRepositoryCustom {

    private final EntityManager em;

    //Join이 너무 많아서 Native Query로

    // seller, user JOIN은 공통 / category는 stream에서 직접
    private static final String BASE_FROM = """
            FROM stream s
            JOIN seller sel ON s.seller_id = sel.id
            JOIN user u     ON sel.user_id  = u.id
            """;

    private static final String SELECT_COLUMNS = """
            SELECT
                s.id,
                s.title,
                s.thumbnail,
                s.status,
                s.scheduled_at,
                s.viewer_count,
                s.category,
                u.id,
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
        return em.createNativeQuery("SELECT DISTINCT sub.* FROM (" + sql + ") sub")
                .setParameter("keyword", keyword)
                .getResultList()
                .stream()
                .map(row -> {
                    Object[] r = (Object[]) row;
                    return new StreamSearchRow(
                            toLong(r[0]),    // streamId
                            (String) r[1],   // title
                            (String) r[2],   // thumbnail
                            (String) r[3],   // status
                            (String) r[4],   // scheduledAt
                            toInt(r[5]),     // viewerCount
                            (String) r[6],   // category
                            toLong(r[7]),    // sellerId
                            (String) r[8],   // sellerNickname
                            (String) r[9]    // sellerProfileImageUri
                    );
                })
                .toList();
    }

    private Long toLong(Object o) {
        return o != null ? ((Number) o).longValue() : null;
    }

    private Integer toInt(Object o) {
        return o != null ? ((Number) o).intValue() : null;
    }
}
