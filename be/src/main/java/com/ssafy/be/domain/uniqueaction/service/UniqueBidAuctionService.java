package com.ssafy.be.domain.uniqueaction.service;

import com.ssafy.be.domain.auction.dto.response.AuctionCommentResponse;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.entity.UniqueBidAuctionDetail;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.uniqueaction.dto.model.DuplicatePriceInfo;
import com.ssafy.be.domain.uniqueaction.dto.model.UniqueAuctionResult;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidStartResponse;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidSyncResponse;
import com.ssafy.be.domain.uniqueaction.exception.UniqueBidAuctionErrorCode;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.common.util.TimeUtils;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static com.ssafy.be.domain.auction.enums.Comment.AUCTION_START;
import static com.ssafy.be.global.websocket.enums.DestType.BROADCAST;
import static com.ssafy.be.global.websocket.enums.StreamEventType.AUCTION_COMMENT;
import static com.ssafy.be.global.websocket.enums.StreamEventType.UNIQUE_AUCTION_START;

@Service
@RequiredArgsConstructor
public class UniqueBidAuctionService {

    private final AuctionRepository auctionRepository;
    private final UniqueBidRepository uniqueBidRepository;
    private final UserRepository userRepository;
    private final ShippingAddressRepository shippingAddressRepository;

    @Transactional
    public void introduceItem(Long auctionId, Long userId) {
        Auction auction = findAuctionById(auctionId);

        if (!auction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.UNAUTHORIZED);

        auction.introduceAuction();
    }

    @Transactional
    public List<StreamPublishTask> startAuction(Long streamId, UniqueBidStartRequest request, Long userId) {
        Auction auction = findAuctionById(request.auctionId());

        if (!auction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.UNAUTHORIZED);

        String serverNow = TimeUtils.nowAsString();
        auction.startAuction(serverNow);

        UniqueBidAuctionDetail detail = auction.getUniqueBidAuctionDetail();

        StreamPublishTask uniqueAuctionStartPublishTask = buildStreamPublishTask(
                BROADCAST,
                streamId,
                null,
                UNIQUE_AUCTION_START,
                buildStartResponse(auction, detail, serverNow)
        );

        StreamPublishTask auctionCommentPublishTask = buildStreamPublishTask(
                BROADCAST,
                streamId,
                null,
                AUCTION_COMMENT,
                buildAuctionCommentResponse(AUCTION_START.getValue())
        );

        return List.of(uniqueAuctionStartPublishTask, auctionCommentPublishTask);
    }

    @Transactional
    public long placeBid(UniqueBidPlaceRequest request, Long userId) {
        Auction auction = findAuctionById(request.auctionId());

        if (!auction.isLive())
            throw new StompException(UniqueBidAuctionErrorCode.NOT_LIVE);

        if (auction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.SELF_BID);

        UniqueBidAuctionDetail detail = auction.getUniqueBidAuctionDetail();

        if (!detail.isValidBidAmount(request.amount()))
            throw new StompException(UniqueBidAuctionErrorCode.INVALID_AMOUNT);

        // HSETNX
        boolean placed = uniqueBidRepository.placeBid(
                auction.getId(), userId, request.amount()
        );

        // 1회 비드 검사
        if (!placed)
            throw new StompException(UniqueBidAuctionErrorCode.ALREADY_BID);

        // 잔액 즉시 차감
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));
        user.depositBidBalance(request.amount());

        return uniqueBidRepository.countParticipants(auction.getId());
    }

    @Transactional
    public UniqueAuctionResult aggregate(UniqueBidCalculateRequest request) {

        Long auctionId = request.auctionId();
        Auction auction = findAuctionById(auctionId);

        if (!auction.isLive())
            throw new StompException(UniqueBidAuctionErrorCode.INVALID_STATUS);

        // LIVE → CALCULATING : placeBid 방지 락
        auction.startCalculating();

        // 유일 최고가
        Optional<Long> winnerPrice = uniqueBidRepository.findHighestUniqueBid(auctionId);

        // TODO : top 개수 및 기준 변경 필요
        List<DuplicatePriceInfo> topDuplicates = uniqueBidRepository.findTopPriceDuplicate(auctionId, 3);

        // 유찰
        if (winnerPrice.isEmpty()) {
            auction.unsold();
            refundAll(auctionId);
            uniqueBidRepository.deleteAll(auctionId);
            return buildUnsoldResult(topDuplicates);
        }

        // 낙찰
        Long winnerId = uniqueBidRepository
                .findUserIdByAmount(auctionId, winnerPrice.get())
                .orElseThrow();

        // 옥션 상태 변경 (최종가 기록)
        auction.sold(winnerPrice.get());

        // 낙찰자 찾기
        User winner = userRepository.findById(winnerId)
                .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));

        // 낙찰자 에스크로
        winner.depositEscrowBalance(winnerPrice.get());

        // 나머지 환불
        refundAllExcept(auctionId, winnerId);
        uniqueBidRepository.deleteAll(auctionId);

        ShippingAddress shipping = shippingAddressRepository
                .findByUserIdAndIsDefaultTrue(winnerId)
                .orElseThrow(() -> new StompException(
                        ShippingAddressErrorCode.DEFAULT_SHIPPING_ADDRESS_NOT_FOUND));

        return buildWonResult(winnerId, winnerPrice.get(), topDuplicates, shipping);
    }

    @Transactional(readOnly = true)
    public UniqueBidSyncResponse syncAuction(Long streamId, Long userId) {
        Auction auction = auctionRepository
                .findByStreamIdAndAuctionStatus(streamId, AuctionStatus.LIVE)
                .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_LIVE));

        return buildSyncResponse(auction, auction.getUniqueBidAuctionDetail(), userId);
    }

    public Long getStreamIdByAuctionId(Long auctionId) {
        return findAuctionById(auctionId).getStream().getId();
    }

    // 유찰되어 전부 환불
    private void refundAll(Long auctionId) {
        uniqueBidRepository.getAllBids(auctionId).forEach((uid, amt) -> {
            User user = userRepository.findById(Long.parseLong(uid.toString())).orElseThrow();
            user.cancelDepositedBidBalance(Long.parseLong(amt.toString()));
        });
    }

    // 낙찰자 제외 환불
    private void refundAllExcept(Long auctionId, Long winnerId) {
        uniqueBidRepository.getAllBids(auctionId).forEach((uid, amt) -> {
            Long userId = Long.parseLong(uid.toString());
            if (!userId.equals(winnerId)) {
                User user = userRepository.findById(userId).orElseThrow();
                user.cancelDepositedBidBalance(Long.parseLong(amt.toString()));
            }
        });
    }

    private Auction findAuctionById(Long auctionId) {
        return auctionRepository.findById(auctionId)
                .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_FOUND));
    }

    private UniqueAuctionResult buildUnsoldResult(List<DuplicatePriceInfo> topDuplicates) {
        return UniqueAuctionResult.builder()
                .isWon(false)
                .topDuplicates(topDuplicates)
                .build();
    }

    private UniqueAuctionResult buildWonResult(Long winnerId, Long winnerPrice,
                                               List<DuplicatePriceInfo> topDuplicates,
                                               ShippingAddress shipping) {
        return UniqueAuctionResult.builder()
                .isWon(true)
                .winnerId(winnerId)
                .winnerPrice(winnerPrice)
                .topDuplicates(topDuplicates)
                .shippingAddress(shipping)
                .build();
    }

    private UniqueBidStartResponse buildStartResponse(Auction auction, UniqueBidAuctionDetail detail, String serverNow) {
        return UniqueBidStartResponse.builder()
                .bidRange(UniqueBidStartResponse.BidRangeDto.builder()
                        .minPrice(detail.getMinPrice())
                        .maxPrice(detail.getMaxPrice())
                        .bidUnit(auction.getItem().getBidUnit())
                        .build())
                .timer(UniqueBidStartResponse.TimerDto.builder()
                        .durationSeconds(auction.getItem().getAuctionDuration())
                        .serverNow(serverNow)
                        .serverStartedAt(auction.getStartedAt())
                        .build())
                .build();
    }

    private UniqueBidSyncResponse buildSyncResponse(Auction auction, UniqueBidAuctionDetail detail, Long userId) {
        return UniqueBidSyncResponse.builder()
                .bidRange(UniqueBidSyncResponse.BidRangeDto.builder()
                        .minPrice(detail.getMinPrice())
                        .maxPrice(detail.getMaxPrice())
                        .bidUnit(auction.getItem().getBidUnit())
                        .build())
                .timer(UniqueBidSyncResponse.TimerDto.builder()
                        .durationSeconds(auction.getItem().getAuctionDuration())
                        .serverNow(TimeUtils.nowAsString())
                        .serverStartedAt(auction.getStartedAt())
                        .build())
                .participantCount(uniqueBidRepository.countParticipants(auction.getId()))
                .hasBid(uniqueBidRepository.existsBid(auction.getId(), userId))
                .build();
    }

    private static AuctionCommentResponse buildAuctionCommentResponse(String message) {
        return AuctionCommentResponse.builder()
                .message(message)
                .build();
    }

    @Transactional(readOnly = true)
    public long getParticipantCount(Long auctionId) {
        return uniqueBidRepository.countParticipants(auctionId);
    }

    public <T> StreamPublishTask buildStreamPublishTask(DestType destType, Long streamId, Long userId, StreamEventType eventType, T payload) {
        return StreamPublishTask.builder()
                .destType(destType)
                .streamId(streamId)
                .userId(userId)
                .eventType(eventType)
                .payload(payload)
                .build();
    }
}