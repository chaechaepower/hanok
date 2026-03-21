package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.domain.seller.dto.request.SellerProfileUpdateRequest;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.*;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.response.ScheduledStreamResponse;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ItemRepository itemRepository;
    private final StreamRepository streamRepository;
    private final EscrowRepository escrowRepository;
    private final BiznoClient biznoClient;

    @Value("${bizno.api.key}")
    private String biznoApiKey;

    private final RestClient restClient = RestClient.create();

    @Transactional
    public SellerRegisterResponse register(Long userId, SellerRegisterRequest request) {
        if (sellerRepository.existsByUserId(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_ALREADY_EXISTS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GlobalException(UserErrorCode.USER_NOT_FOUND));

        // 닉네임 업데이트
        if (request.nickname() != null) {
            user.updateProfile(request.nickname(), null);
        }

        // 계좌 정보 업데이트
        if (request.bankCode() != null && request.accountNum() != null && request.accountName() != null) {
            user.updateAccount(request.bankCode(), request.accountName(), request.accountNum());
        }

        Seller seller = Seller.builder()
                .intro(request.intro() != null ? request.intro() : "")
                .type(request.type())
                .businessNumber(request.businessNumber())
                .penaltyCount(0)
                .instaUrl(request.instaUrl())
                .youtubeUrl(request.youtubeUrl())
                .tiktokUrl(request.tiktokUrl())
                .user(user)
                .build();

        Seller saved = sellerRepository.save(seller);
        return new SellerRegisterResponse(saved.getId(), user.getNickname());
    }

    @Transactional(readOnly = true)
    public SellerStatusResponse getSellerStatus(Long userId) {
        return sellerRepository.findByUserId(userId)
                .map(seller -> new SellerStatusResponse(true, seller.getId()))
                .orElse(new SellerStatusResponse(false, null));
    }

    @Transactional(readOnly = true)
    public SellerProfileResponse getProfile(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        User user = seller.getUser();

        long followerCount = followRepository.countBySeller(seller);

        // N+1 개선 - 쿼리 1번으로 해결
        List<RecentSaleResponse> recentSales = itemRepository
                .findTop10SoldItemsWithFinalPrice(sellerId)
                .stream()
                .map(row -> new RecentSaleResponse(
                        ((Item) row[0]).getId(),
                        ((Item) row[0]).getName(),
                        (Long) row[1],
                        ((Item) row[0]).getSoldAt()
                ))
                .toList();

        // 예약된 방송 목록 (최근 10개)
        List<ScheduledStreamResponse> posts = streamRepository
                .findTop10BySellerIdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
                        sellerId, StreamStatus.SCHEDULED, LocalDateTime.now())
                .stream()
                .map(stream -> new ScheduledStreamResponse(
                        stream.getId(),
                        stream.getTitle(),
                        stream.getCategory().name(),
                        stream.getThumbnail(),
                        stream.getScheduledAt(),
                        stream.getStatus()
                ))
                .toList();

        return new SellerProfileResponse(
                seller.getId(),
                user.getNickname(),
                seller.getIntro(),
                user.getProfileImage(),
                seller.getInstaUrl(),
                seller.getYoutubeUrl(),
                seller.getTiktokUrl(),
                new SellerStatsResponse(
                        seller.getRating(),
                        seller.getAvgShipDays(),
                        followerCount
                ),
                recentSales,
                posts
        );
    }

    @Transactional
    public void updateProfile(Long sellerId, Long userId, SellerProfileUpdateRequest request) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        // 본인 확인
        if (!seller.getUser().getId().equals(userId)) {
            throw new GlobalException(SellerErrorCode.SELLER_FORBIDDEN);
        }

        seller.updateProfile(request.intro(), request.instaUrl(), request.youtubeUrl(), request.tiktokUrl());
        seller.getUser().updateProfile(request.nickname(), request.profileImage());
    }

    public BiznoVerifyResponse verifyBizno(String bizno, int gb) {
        BiznoApiResponse response = biznoClient.verify(bizno, gb);

        if (response == null || response.resultCode() != 0 || response.totalCount() == 0) {
            return new BiznoVerifyResponse(false);
        }

        boolean valid = response.items().stream()
                .findFirst()
                .map(item -> item.bstt() != null && item.bstt().contains("계속사업자"))
                .orElse(false);

        return new BiznoVerifyResponse(valid);
    }

    public List<EscrowListResponse> getAllSoldAuctions(Long sellerId) {
        return escrowRepository.findBySellerId(sellerId).stream()
                .map(escrow -> {
                    Item item = escrow.getAuction().getItem();

                    return EscrowListResponse.builder()
                            .image(item.getImage1())
                            .itemName(item.getName())
                            .amount(escrow.getWinningPrice())
                            .escrowStatus(escrow.getEscrowStatus())
                            .createdAt(escrow.getCreatedAt())
                            .build();
                }).toList();
    }

    @Transactional(readOnly = true)
    public SellerReputationResponse getReputation(Long sellerId, Long requestUserId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        long followerCount = followRepository.countBySellerId(sellerId);

        // 본인 여부 확인
        boolean isOwner = requestUserId != null && seller.getUser().getId().equals(requestUserId);

        if (!isOwner) {
            // 공개 응답
            return SellerReputationResponse.builder()
                    .followerCount(followerCount)
                    .build();
        }

        // 상세 응답
        long completedCount = escrowRepository.countBySellerIdAndEscrowStatus(
                sellerId, EscrowStatus.COMPLETED);
        long cancelCount = escrowRepository.countBySellerIdAndEscrowStatus(
                sellerId, EscrowStatus.CANCELLED);
        long totalTrades = completedCount + cancelCount;

        double completionRate = totalTrades == 0 ? 100.0
                : Math.round((double) completedCount / totalTrades * 1000.0) / 10.0;

        return SellerReputationResponse.builder()
                .followerCount(followerCount)
                .totalTrades(totalTrades)
                .completionRate(completionRate)
                .cancelCount(cancelCount)
                .avgShipDays(seller.getAvgShipDays())
                .build();
    }

    @Transactional(readOnly = true)
    public SellerReportResponse getSellerReport(Long sellerId, Long requestUserId) {

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        // 본인 확인
        if (requestUserId == null || !seller.getUser().getId().equals(requestUserId)) {
            throw new GlobalException(SellerErrorCode.SELLER_FORBIDDEN);
        }

        // 1. 에스크로 정산 요약
        List<Object[]> escrowStats = escrowRepository.findSettlementSummaryBySellerId(sellerId);
        long completedAmount = 0L;
        long pendingAmount = 0L;

        for (Object[] stat : escrowStats) {
            EscrowStatus status = (EscrowStatus) stat[0];
            Long amount = (Long) stat[1];

            if (status == EscrowStatus.COMPLETED) {
                completedAmount += amount;
            } else if (status == EscrowStatus.DEPOSITED || status == EscrowStatus.SHIPPED) {
                pendingAmount += amount;
            }
        }

        // 2. 일별 매출 추이
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        List<Object[]> dailyStats = escrowRepository.findDailySalesBySellerId(sellerId, startOfMonth);
        List<SellerReportResponse.DailySalesDto> dailySales = dailyStats.stream()
                .map(row -> new SellerReportResponse.DailySalesDto((String) row[0], ((Number) row[1]).longValue()))
                .toList();

        // 3. 인기 랭킹 Top 3
        List<Object[]> topItems = itemRepository.findTopHotItemsBySellerId(sellerId);
        List<SellerReportResponse.TopHotItemDto> hotItemDtos = topItems.stream()
                .map(row -> new SellerReportResponse.TopHotItemDto(
                        ((Number) row[0]).longValue(), (String) row[1], (String) row[2],
                        ((Number) row[3]).longValue(), row[4] != null ? ((Number) row[4]).longValue() : 0L
                )).toList();

        // ---------------------------------------------------------
        // 👇 추가 요청하신 4가지 지표 계산 로직 시작
        // ---------------------------------------------------------

        // 4. 거래 성사율 통계 (기존 getReputation 로직 재활용)
        long completedTrades = escrowRepository.countBySellerIdAndEscrowStatus(sellerId, EscrowStatus.COMPLETED);
        long cancelledTrades = escrowRepository.countBySellerIdAndEscrowStatus(sellerId, EscrowStatus.CANCELLED);
        long totalTrades = completedTrades + cancelledTrades;
        double completionRate = totalTrades == 0 ? 100.0 : Math.round((double) completedTrades / totalTrades * 1000.0) / 10.0;

        // 5. 경매 통계 (ItemRepository 활용)
        // (ItemStatus.SOLD 와 UNSOLD 등 프로젝트의 실제 상태값으로 이름을 맞춰주세요!)
        long totalAuctions = itemRepository.findBySellerId(sellerId).size();
        long successfulBids = itemRepository.countBySellerIdAndStatus(sellerId, ItemStatus.SOLD);
        long failedBids = totalAuctions - successfulBids; // 임시 계산 (또는 UNSOLD 카운트)

        // 6. 카테고리별 통계
        List<Object[]> catStats = escrowRepository.findCategoryStatsBySellerId(sellerId);
        List<SellerReportResponse.CategoryStatsDto> categoryStatsDtos = catStats.stream()
                .map(row -> new SellerReportResponse.CategoryStatsDto(
                        row[0] != null ? row[0].toString() : "기타", // category
                        ((Number) row[1]).longValue(),               // salesCount
                        ((Number) row[2]).longValue()                // salesAmount
                )).toList();

        // 7. 평판 상세 (Seller 엔티티에서 바로 가져옴)
        SellerReportResponse.ReputationDto reputationDto = new SellerReportResponse.ReputationDto(
                seller.getRating(), seller.getAvgShipDays(), seller.getPenaltyCount()
        );

        // 최종 반환 (모든 데이터 포함)
        return new SellerReportResponse(
                completedAmount + pendingAmount,
                completedAmount,
                new SellerReportResponse.EscrowSummaryDto(pendingAmount, completedAmount),
                new SellerReportResponse.TrendGraphDto(completedAmount, 10000000L, 25.0, dailySales),
                hotItemDtos,

                // 새롭게 꽉꽉 채워넣은 4가지 데이터
                new SellerReportResponse.AuctionStatsDto(totalAuctions, successfulBids, failedBids),
                new SellerReportResponse.TransactionStatsDto(completedTrades, cancelledTrades, completionRate),
                categoryStatsDtos,
                reputationDto
        );
    }
}