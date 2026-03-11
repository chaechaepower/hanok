package com.ssafy.be.domain.follow.repository;

import com.ssafy.be.domain.follow.entity.Follow;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByUserAndSeller(User user, Seller seller);

    boolean existsByUserAndSeller(User user, Seller seller);

    long countBySeller(Seller seller);

    long countByUser(User user);
}