package com.ssafy.be.domain.item.repository;

import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    @EntityGraph(attributePaths = {"tags"})
    List<Item> findBySellerId(Long sellerId);

    @EntityGraph(attributePaths = {"tags"})
    List<Item> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    @EntityGraph(attributePaths = {"tags"})
    List<Item> findBySellerIdAndStatus(Long sellerId, ItemStatus status);

    @EntityGraph(attributePaths = {"tags"})
    List<Item> findBySellerIdAndStatusOrderByCreatedAtDesc(Long sellerId, ItemStatus status);

    Optional<Item> findByIdAndSellerId(Long id, Long sellerId);

    List<Item> findTop10BySellerIdAndStatusOrderBySoldAtDesc(Long sellerId, ItemStatus status);

    long countBySellerIdAndStatus(Long sellerId, ItemStatus status);

    @Query("SELECT i, a.finalPrice FROM Item i " +
            "LEFT JOIN Auction a ON a.item.id = i.id " +
            "WHERE i.seller.id = :sellerId AND i.status = 'SOLD' " +
            "ORDER BY i.soldAt DESC " +
            "LIMIT 10")
    List<Object[]> findTop10SoldItemsWithFinalPrice(@Param("sellerId") Long sellerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Item i
            SET i.status = :ready
            WHERE i.status = :scheduled
            AND i.id IN (
                            SELECT a.item.id
                            FROM Auction a 
                            WHERE a.stream.id = :streamId
                        )
            """)
    int updateScheduledItemsToReadyByStreamId(
            @Param("streamId") Long streamId,
            @Param("scheduled") ItemStatus scheduled,
            @Param("ready") ItemStatus ready
    );
}

