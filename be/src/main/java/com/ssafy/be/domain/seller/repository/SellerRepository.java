package com.ssafy.be.domain.seller.repository;

import com.ssafy.be.domain.seller.entity.Seller;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerRepository extends JpaRepository<Seller, Long> {

    boolean existsByUserId(Long userId);
}