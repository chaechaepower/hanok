package com.ssafy.be.domain.follow.repository;

import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByUserAndSeller(User user, Seller seller);

    @Query("""
            SELECT DISTINCT f
            FROM Follow f
            JOIN FETCH f.user
            WHERE f.seller = :seller
            """)
    List<Follow> findBySeller(@Param("seller") Seller seller);

    boolean existsByUserAndSeller(User user, Seller seller);

    long countBySeller(Seller seller);

    long countByUser(User user);

    long countBySellerId(Long sellerId);

    @Query(
            value = "SELECT f FROM Follow f JOIN FETCH f.seller s JOIN FETCH s.user WHERE f.user = :user",
            countQuery = "SELECT COUNT(f) FROM Follow f WHERE f.user = :user"
    )
    Page<Follow> findByUserWithSeller(@Param("user") User user, Pageable pageable);

    @Query("SELECT f.seller.id, COUNT(f) AS cnt "
            + "FROM Follow f "
            + "GROUP BY f.seller.id "
            + "ORDER BY cnt DESC")
    List<Object[]> findTopSellerIdsByFollowerCount(Pageable pageable);

    @Query("SELECT f.seller.id FROM Follow f WHERE f.user.id = :userId")
    Set<Long> findFollowedSellerIdsByUserId(@Param("userId") Long userId);
}
