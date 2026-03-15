package com.ssafy.be.domain.notice.controller;


import com.ssafy.be.domain.notice.controller.api.SellerNoticeApi;
import com.ssafy.be.domain.notice.dto.request.NoticeCreateRequest;
import com.ssafy.be.domain.notice.dto.request.NoticeUpdateRequest;
import com.ssafy.be.domain.notice.dto.response.NoticeResponse;
import com.ssafy.be.domain.notice.service.SellerNoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sellers/{sellerId}/notices")
@RequiredArgsConstructor
public class SellerNoticeController implements SellerNoticeApi {

    private final SellerNoticeService noticeService;

    @PostMapping
    @Override
    public ResponseEntity<NoticeResponse> createNotice(
            @PathVariable Long sellerId,
            @RequestBody @Valid NoticeCreateRequest request) {
        NoticeResponse response = noticeService.createNotice(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Override
    public ResponseEntity<List<NoticeResponse>> getNotices(@PathVariable Long sellerId) {
        List<NoticeResponse> responses = noticeService.getNotices(sellerId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{noticeId}")
    @Override
    public ResponseEntity<NoticeResponse> getNotice(
            @PathVariable Long sellerId,
            @PathVariable Long noticeId) {
        NoticeResponse response = noticeService.getNotice(sellerId, noticeId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{noticeId}")
    @Override
    public ResponseEntity<NoticeResponse> updateNotice(
            @PathVariable Long sellerId,
            @PathVariable Long noticeId,
            @RequestBody @Valid NoticeUpdateRequest request) {
        NoticeResponse response = noticeService.updateNotice(sellerId, noticeId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{noticeId}")
    @Override
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long sellerId,
            @PathVariable Long noticeId) {
        noticeService.deleteNotice(sellerId, noticeId);
        return ResponseEntity.noContent().build();
    }
}
