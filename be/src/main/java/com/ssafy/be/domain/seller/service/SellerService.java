package com.ssafy.be.domain.seller.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.repository.AuctionBidRepository;
import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.repository.EscrowRepository;
import com.ssafy.be.domain.follow.repository.FollowRepository;
import com.ssafy.be.domain.item.entity.AuctionType;
import com.ssafy.be.domain.item.entity.Item;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidRepository;
import com.ssafy.be.domain.seller.client.BiznoClient;
import com.ssafy.be.domain.seller.dto.request.SellerProfileUpdateRequest;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.*;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.dto.response.ScheduledStreamResponse;
import com.ssafy.be.domain.stream.dto.response.SellerRankingResponse;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.exception.GlobalException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import com.ssafy.be.domain.escrow.entity.EscrowStatus;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ItemRepository itemRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final UniqueBidRepository uniqueBidRepository;
    private final StreamRepository streamRepository;
    private final EscrowRepository escrowRepository;
    private final BiznoClient biznoClient;

    @Value("${bizno.api.key}")
    private String biznoApiKey;

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
        // 0. 날짜 기준 설정
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfCurrentMonth = YearMonth.now().atDay(1).atStartOfDay(); // 이번달 1일 00:00
        LocalDateTime startOfLastMonth = startOfCurrentMonth.minusMonths(1);        // 지난달 1일 00:00

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new GlobalException(SellerErrorCode.SELLER_NOT_FOUND));

        // 본인 확인
        if (requestUserId == null || !seller.getUser().getId().equals(requestUserId)) {
            throw new GlobalException(SellerErrorCode.SELLER_FORBIDDEN);
        }

        // 1. 에스크로 정산 요약 (전체 기간 기준)
        List<Object[]> escrowStats = escrowRepository.findSettlementSummaryBySellerId(sellerId);
        long completedAmount = 0L;
        long pendingAmount = 0L;

        for (Object[] stat : escrowStats) {
            EscrowStatus status = (EscrowStatus) stat[0];
            if (stat[1] == null) continue;
            long amount = ((Number) stat[1]).longValue();

            if (status == EscrowStatus.COMPLETED) {
                completedAmount += amount;
            } else if (status == EscrowStatus.DEPOSITED || status == EscrowStatus.SHIPPED) {
                pendingAmount += amount;
            }
        }

        // 2. 이번 달 매출 vs 지난 달 매출 및 성장률 계산 (TrendGraph용)
        // 이번 달 정산 완료액 조회
        Long currentMonthRaw = escrowRepository.findTotalSalesBySellerIdAndPeriod(sellerId, startOfCurrentMonth, now);
        long currentMonthTotal = (currentMonthRaw != null) ? currentMonthRaw : 0L;

        // 지난 달 정산 완료액 조회
        Long lastMonthRaw = escrowRepository.findTotalSalesBySellerIdAndPeriod(sellerId, startOfLastMonth, startOfCurrentMonth);
        long lastMonthTotal = (lastMonthRaw != null) ? lastMonthRaw : 0L;

        // 성장률 계산
        double growthRate = 0.0;
        if (lastMonthTotal > 0) {
            growthRate = Math.round(((double) (currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100) * 10.0) / 10.0;
        } else if (currentMonthTotal > 0) {
            growthRate = 100.0; // 지난달 매출이 없는데 이번달에 생겼다면 100% 성장으로 표시
        }

        // 3. 일별 매출 추이 (이번 달)
        List<Object[]> dailyStats = escrowRepository.findDailySalesBySellerId(sellerId, startOfCurrentMonth);
        List<SellerReportResponse.DailySalesDto> dailySales = dailyStats.stream()
                .map(row -> new SellerReportResponse.DailySalesDto(
                        (String) row[0],
                        row[1] != null ? ((Number) row[1]).longValue() : 0L
                )).toList();

        // 4. 인기 랭킹 Top 3: SOLD 물품의 경매 방식별 입찰 수(Redis) 기준
        List<SellerReportResponse.TopHotItemDto> hotItemDtos = buildTopHotItems(sellerId);

        // 5. 거래 성사율 통계
        long completedTrades = escrowRepository.countBySellerIdAndEscrowStatus(sellerId, EscrowStatus.COMPLETED);
        long cancelledTrades = escrowRepository.countBySellerIdAndEscrowStatus(sellerId, EscrowStatus.CANCELLED);
        long totalTrades = completedTrades + cancelledTrades;
        double completionRate = totalTrades == 0 ? 100.0 : Math.round((double) completedTrades / totalTrades * 1000.0) / 10.0;

        // 6. 경매 통계
        long totalAuctions = itemRepository.findBySellerId(sellerId).size();
        long successfulBids = itemRepository.countBySellerIdAndStatus(sellerId, ItemStatus.SOLD);
        long failedBids = totalAuctions - successfulBids;

        // 7. 카테고리별 통계
        List<Object[]> catStats = escrowRepository.findCategoryStatsBySellerId(sellerId);
        List<SellerReportResponse.CategoryStatsDto> categoryStatsDtos = catStats.stream()
                .map(row -> new SellerReportResponse.CategoryStatsDto(
                        row[0] != null ? row[0].toString() : "기타",
                        row[1] != null ? ((Number) row[1]).longValue() : 0L,
                        row[2] != null ? ((Number) row[2]).longValue() : 0L
                )).toList();

        // 8. 평판 상세
        SellerReportResponse.ReputationDto reputationDto = new SellerReportResponse.ReputationDto(
                seller.getRating(), seller.getAvgShipDays(), seller.getPenaltyCount()
        );

        // 최종 반환 (계산된 동적 데이터 적용)
        return new SellerReportResponse(
                completedAmount + pendingAmount,
                completedAmount,
                new SellerReportResponse.EscrowSummaryDto(pendingAmount, completedAmount),
                new SellerReportResponse.TrendGraphDto(currentMonthTotal, lastMonthTotal, growthRate, dailySales),
                hotItemDtos,
                new SellerReportResponse.AuctionStatsDto(totalAuctions, successfulBids, failedBids),
                new SellerReportResponse.TransactionStatsDto(completedTrades, cancelledTrades, completionRate),
                categoryStatsDtos,
                reputationDto
        );
    }

    @Transactional(readOnly = true)
    public List<SellerRankingResponse> getTopSellers() {
        // 1. 팔로워 수 상위 5명 집계
        List<Object[]> rows = followRepository.findTopSellerIdsByFollowerCount(
                PageRequest.of(0, 5)
        );

        if (rows.isEmpty()) return List.of();

        // 2. sellerId → followerCount 매핑 (순서 보존)
        List<Long> sellerIds = rows.stream()
                .map(r -> ((Number) r[0]).longValue())
                .toList();

        Map<Long, Long> followerCountMap = rows.stream()
                .collect(Collectors.toMap(
                        r -> ((Number) r[0]).longValue(),
                        r -> ((Number) r[1]).longValue()
                ));

        // 3. Seller 정보 벌크 조회 (N+1 방지)
        Map<Long, Seller> sellerMap = sellerRepository.findAllByIdInWithUser(sellerIds)
                .stream()
                .collect(Collectors.toMap(Seller::getId, s -> s));

        // 4. 순위 보존하며 DTO 변환
        return IntStream.range(0, sellerIds.size())
                .mapToObj(i -> {
                    Long sellerId = sellerIds.get(i);
                    Seller seller = sellerMap.get(sellerId);
                    return new SellerRankingResponse(
                            i + 1,
                            sellerId,
                            seller.getUser().getNickname(),
                            seller.getUser().getProfileImage(),
                            followerCountMap.get(sellerId)
                    );
                })
                .toList();
    }

    private List<SellerReportResponse.TopHotItemDto> buildTopHotItems(Long sellerId) {
        List<Auction> soldAuctions = auctionRepository.findAllBySellerIdAndItemStatus(sellerId, ItemStatus.SOLD);

        record Scored(Auction auction, long bidCount, long finalPrice) {}

        return soldAuctions.stream()
                .map(a -> new Scored(
                        a,
                        resolveBidCount(a),
                        Optional.ofNullable(a.getFinalPrice()).orElse(0L)))
                .sorted(Comparator
                        .comparingLong(Scored::bidCount).reversed()
                        .thenComparingLong(Scored::finalPrice).reversed()
                        .thenComparing(
                                s -> s.auction().getItem().getSoldAt(),
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(s -> s.auction().getItem().getId(), Comparator.reverseOrder()))
                .limit(3)
                .map(s -> {
                    var item = s.auction().getItem();
                    return new SellerReportResponse.TopHotItemDto(
                            item.getId(),
                            item.getName(),
                            item.getImage1(),
                            s.bidCount(),
                            s.finalPrice());
                })
                .toList();
    }

    private long resolveBidCount(Auction auction) {
        Long auctionId = auction.getId();
        if (auction.getAuctionType() == AuctionType.BOTTOM_UP) {
            return auctionBidRepository.countBids(auctionId);
        }
        return uniqueBidRepository.countParticipants(auctionId);
    }

}