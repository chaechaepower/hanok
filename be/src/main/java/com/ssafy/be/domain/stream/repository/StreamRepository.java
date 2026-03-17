package com.ssafy.be.domain.stream.repository;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.Stream;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.ssafy.be.domain.stream.entity.StreamStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StreamRepository extends JpaRepository<Stream, Long> {
    boolean existsByIdAndSellerId(Long streamId, Long sellerId);

    Optional<Stream> findByIdAndSellerId(Long id, Long sellerId);

    // LIVE 목록 조회 (category 필터 선택)
    @Query(
            "SELECT s FROM Stream s JOIN FETCH s.seller sel JOIN FETCH sel.user "
                    + "WHERE s.status = 'LIVE' "
                    + "AND (:category IS NULL OR s.category = :category)")
    Page<Stream> findLiveStreams(@Param("category") Category category, Pageable pageable);

    // SCHEDULED 목록 조회 (category 필터 선택)
    @Query(
            "SELECT s FROM Stream s JOIN FETCH s.seller sel JOIN FETCH sel.user "
                    + "WHERE s.status = 'SCHEDULED' "
                    + "AND (:category IS NULL OR s.category = :category)")
    Page<Stream> findScheduledStreams(@Param("category") Category category, Pageable pageable);

    @Query(
            "SELECT s FROM Stream s JOIN FETCH s.seller sel JOIN FETCH sel.user "
                    + "WHERE s.status = 'LIVE' "
                    + "AND (:category IS NULL OR s.category = :category)")
    List<Stream> findAllLiveStreams(@Param("category") Category category);

    @Query(
            "SELECT s FROM Stream s JOIN FETCH s.seller sel JOIN FETCH sel.user "
                    + "WHERE s.status = 'SCHEDULED' "
                    + "AND (:category IS NULL OR s.category = :category)")
    List<Stream> findAllScheduledStreams(@Param("category") Category category);

    List<Stream> findTop10BySellerIdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
            Long sellerId, StreamStatus status, LocalDateTime now);

    // scheduled API용 - 특정 userId(seller의 user.id)에 해당하는 LIVE + SCHEDULED 스트림만 조회
    @Query("SELECT s FROM Stream s JOIN FETCH s.seller sel JOIN FETCH sel.user u "
            + "WHERE s.status IN :statuses AND u.id = :userId "
            + "ORDER BY s.scheduledAt ASC")
    Slice<Stream> findByStatusInAndSellerUserId(
            @Param("statuses") List<StreamStatus> statuses,
            @Param("userId") Long userId,
            Pageable pageable);
}
