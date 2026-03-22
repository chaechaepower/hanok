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

}