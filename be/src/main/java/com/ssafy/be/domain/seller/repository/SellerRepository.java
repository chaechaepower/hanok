package com.ssafy.be.domain.seller.repository;

import com.ssafy.be.domain.seller.entity.Seller;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SellerRepository extends JpaRepository<Seller, Long> {

    boolean existsByUserId(Long userId);

    Optional<Seller> findByUserId(Long userId);

    @Query("SELECT s FROM Seller s JOIN FETCH s.user WHERE s.id IN :ids")
    List<Seller> findAllByIdInWithUser(@Param("ids") List<Long> ids);

    @Query(nativeQuery = true, value = """
            SELECT seller_id, nickname, profile_image, follower_count
            FROM (
                SELECT
                    s.id                          AS seller_id,
                    u.nickname,
                    u.profile_image,
                    COUNT(DISTINCT f.id)           AS follower_count,
                    COUNT(DISTINCT e_recent.id) * 40
                        + COUNT(DISTINCT f.id)     * 0.1
                        + CASE
                            WHEN (COUNT(DISTINCT e_all.id) + s.penalty_count) = 0 THEN 100
                            ELSE COUNT(DISTINCT e_all.id) * 100.0
                                 / (COUNT(DISTINCT e_all.id) + s.penalty_count)
                          END
                        - s.penalty_count         * 30  AS score
                FROM seller s
                JOIN user u ON u.id = s.user_id
                LEFT JOIN follow f
                       ON f.seller_id = s.id
                LEFT JOIN escrow e_recent
                       ON e_recent.seller_id    = s.id
                      AND e_recent.escrow_status = 'COMPLETED'
                      AND e_recent.created_at   >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                LEFT JOIN escrow e_all
                       ON e_all.seller_id    = s.id
                      AND e_all.escrow_status = 'COMPLETED'
                GROUP BY s.id, u.nickname, u.profile_image, s.penalty_count
            ) ranked
            ORDER BY score DESC
            LIMIT 5
            """)
    List<Object[]> findTopSellersByCompositeScore();

}