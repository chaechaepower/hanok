package com.ssafy.be.domain.stream.repository;

import com.ssafy.be.domain.stream.entity.Stream;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StreamRepository extends JpaRepository<Stream, Long> {
    boolean existsByIdAndSellerId(Long streamId, Long sellerId);
    Optional<Stream> findByIdAndSellerId(Long id, Long sellerId);
}
