package com.ssafy.be.domain.notice.service;


import com.ssafy.be.domain.notice.dto.request.NoticeCreateRequest;
import com.ssafy.be.domain.notice.dto.request.NoticeUpdateRequest;
import com.ssafy.be.domain.notice.dto.response.NoticeResponse;
import com.ssafy.be.domain.notice.entity.SellerNotice;
import com.ssafy.be.domain.notice.exception.NoticeErrorCode;
import com.ssafy.be.domain.notice.repository.SellerNoticeRepository;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerNoticeService {

    private final SellerNoticeRepository noticeRepository;
    private final SellerRepository sellerRepository;

    @Transactional
    public NoticeResponse createNotice(Long sellerId, NoticeCreateRequest request) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        SellerNotice notice = SellerNotice.builder()
                .title(request.title())
                .content(request.content())
                .seller(seller)
                .build();

        SellerNotice savedNotice = noticeRepository.save(notice);
        return convertToResponse(savedNotice);
    }

    public List<NoticeResponse> getNotices(Long sellerId) {
        return noticeRepository.findAllBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(this::convertToResponse)
                .toList();
    }

    public NoticeResponse getNotice(Long sellerId, Long noticeId) {
        SellerNotice notice = getValidNotice(sellerId, noticeId);
        return convertToResponse(notice);
    }

    @Transactional
    public NoticeResponse updateNotice(Long sellerId, Long noticeId, NoticeUpdateRequest request) {
        SellerNotice notice = noticeRepository.findById(noticeId).orElseThrow();

        String newTitle   = request.title()   != null ? request.title()   : notice.getTitle();
        String newContent = request.content() != null ? request.content() : notice.getContent();

        notice.update(newTitle, newContent);
        return convertToResponse(notice);
    }

    @Transactional
    public void deleteNotice(Long sellerId, Long noticeId) {
        SellerNotice notice = getValidNotice(sellerId, noticeId);
        noticeRepository.delete(notice);
    }

    private SellerNotice getValidNotice(Long sellerId, Long noticeId) {
        SellerNotice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new GlobalException(NoticeErrorCode.NOTICE_NOT_FOUND));

        if (!notice.getSeller().getId().equals(sellerId)) {
            throw new GlobalException(NoticeErrorCode.UNAUTHORIZED_NOTICE_ACCESS);
        }
        return notice;
    }

    private NoticeResponse convertToResponse(SellerNotice notice) {
        return NoticeResponse.builder()
                .noticeId(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .createdAt(notice.getCreatedAt())
                .updatedAt(notice.getUpdatedAt())
                .build();
    }
}
