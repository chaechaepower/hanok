package com.ssafy.be.domain.uniqueaction.service;

import com.ssafy.be.domain.auction.dto.response.AuctionCommentResponse;
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
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuction;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidStatus;
import com.ssafy.be.domain.uniqueaction.exception.UniqueBidAuctionErrorCode;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionRepository;
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

    private final UniqueBidAuctionRepository uniqueBidAuctionRepository;
    private final UniqueBidRepository uniqueBidRepository;
    private final UserRepository userRepository;
    private final ShippingAddressRepository shippingAddressRepository;


    // TODO : 이제 분기가 나뉘면 auctiontype 리턴필요하지 않나?
    @Transactional
    public void introduceItem(Long auctionId, Long userId) {
        UniqueBidAuction uniqueAuction = findByAuctionId(auctionId);

        // 판매자만 가능
        if (!uniqueAuction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.UNAUTHORIZED);

        uniqueAuction.introduce();
    }


    @Transactional
    public List<StreamPublishTask> startAuction(Long streamId, UniqueBidStartRequest request, Long userId) {
        UniqueBidAuction uniqueAuction = findByAuctionId(request.auctionId());

        if (!uniqueAuction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.UNAUTHORIZED);

        String serverNow = TimeUtils.nowAsString();
        uniqueAuction.start(serverNow); // 이제 INTRODUCING 검증

        StreamPublishTask uniqueAuctionStartPublishTask =buildStreamPublishTask(
                BROADCAST,
                streamId,
                null,
                UNIQUE_AUCTION_START,
                buildStartResponse(uniqueAuction, serverNow)
        );

        StreamPublishTask auctionCommentPublishTask =buildStreamPublishTask(
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
        UniqueBidAuction uniqueAuction = findByAuctionId(request.auctionId());

        if (!uniqueAuction.isLive())
            throw new StompException(UniqueBidAuctionErrorCode.NOT_LIVE);

        if (uniqueAuction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.SELF_BID);

        if (!uniqueAuction.isValidBidAmount(request.amount()))
            throw new StompException(UniqueBidAuctionErrorCode.INVALID_AMOUNT);

        // HSETNX
        boolean placed = uniqueBidRepository.placeBid(
                uniqueAuction.getAuctionId(), userId, request.amount()
        );

        // 1회 비드 검사
        if (!placed)
            throw new StompException(UniqueBidAuctionErrorCode.ALREADY_BID);

        // 잔액 즉시 차감
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));
        user.depositBidBalance(request.amount());

        return uniqueBidRepository.countParticipants(uniqueAuction.getAuctionId());
    }

    @Transactional
    public UniqueAuctionResult aggregate(UniqueBidCalculateRequest request) {

        Long auctionId = request.auctionId();
        UniqueBidAuction uniqueAuction = findByAuctionId(auctionId);

        if (!uniqueAuction.isLive())
            throw new StompException(UniqueBidAuctionErrorCode.INVALID_STATUS);

        // LIVE → CALCULATING
        // placebid 방지 필요
        uniqueAuction.startCalculating();

        // 유일 최고가
        Optional<Long> winnerPrice = uniqueBidRepository.findHighestUniqueBid(auctionId);

        // TODO : top 개수 및 기준 변경 필요
        List<DuplicatePriceInfo> topDuplicates = uniqueBidRepository.findTopPriceDuplicate(auctionId, 3);

        // 유찰
        if (winnerPrice.isEmpty()) {
            uniqueAuction.unsold();
            refundAll(auctionId);
            uniqueBidRepository.deleteAll(auctionId);
            return buildUnsoldResult(topDuplicates);
        }

        // 낙찰
        Long winnerId = uniqueBidRepository
                .findUserIdByAmount(auctionId, winnerPrice.get())
                .orElseThrow();

        // 옥션 상태 변경
        uniqueAuction.sold();

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
        UniqueBidAuction uniqueAuction = uniqueBidAuctionRepository
                .findByAuction_Stream_IdAndStatus(streamId, UniqueBidStatus.LIVE)
                .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_LIVE));

        return buildSyncResponse(uniqueAuction, userId);
    }


    public Long getStreamIdByAuctionId(Long auctionId) {
        return findByAuctionId(auctionId).getStreamId();
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

    private UniqueBidAuction findByAuctionId(Long auctionId) {
        return uniqueBidAuctionRepository.findByAuction_Id(auctionId)
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

    private UniqueBidStartResponse buildStartResponse(UniqueBidAuction uniqueAuction, String serverNow) {
        return UniqueBidStartResponse.builder()
                .minPrice(uniqueAuction.getMinPrice())
                .maxPrice(uniqueAuction.getMaxPrice())
                .bidUnit(uniqueAuction.getAuction().getItem().getBidUnit())
                .durationSeconds(uniqueAuction.getDuration())
                .serverNow(serverNow)
                .serverStartedAt(uniqueAuction.getStartedAt())
                .build();
    }

    private UniqueBidSyncResponse buildSyncResponse(UniqueBidAuction uniqueAuction, Long userId) {
        return UniqueBidSyncResponse.builder()
                .minPrice(uniqueAuction.getMinPrice())
                .maxPrice(uniqueAuction.getMaxPrice())
                .bidUnit(uniqueAuction.getAuction().getItem().getBidUnit())
                .durationSeconds(uniqueAuction.getDuration())
                .serverNow(TimeUtils.nowAsString())
                .serverStartedAt(uniqueAuction.getStartedAt())
                .participantCount(uniqueBidRepository.countParticipants(uniqueAuction.getAuctionId()))
                .hasBid(uniqueBidRepository.existsBid(uniqueAuction.getAuctionId(), userId))
                .build();
    }

    private static AuctionCommentResponse buildAuctionCommentResponse(String message) {
        return AuctionCommentResponse.builder()
                .message(message)
                .build();
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
