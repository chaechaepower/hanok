package com.ssafy.be.domain.notice.repository;

import com.ssafy.be.domain.notice.entity.SellerNotice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerNoticeRepository extends JpaRepository<SellerNotice, Long> {
    // 특정 셀러의 공지사항 목록 최신순 조회
    List<SellerNotice> findAllBySellerIdOrderByCreatedAtDesc(Long sellerId);
}