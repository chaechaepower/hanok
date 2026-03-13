package com.ssafy.be.domain.uniqueaction.service;

import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.shippingaddress.exception.ShippingAddressErrorCode;
import com.ssafy.be.domain.shippingaddress.repository.ShippingAddressRepository;
import com.ssafy.be.domain.uniqueaction.dto.model.DuplicatePriceInfo;
import com.ssafy.be.domain.uniqueaction.dto.model.UniqueAuctionResult;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidStartResponse;
import com.ssafy.be.domain.uniqueaction.entity.UniqueBidAuction;
import com.ssafy.be.domain.uniqueaction.exception.UniqueBidAuctionErrorCode;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidAuctionRepository;
import com.ssafy.be.domain.uniqueaction.repository.UniqueBidRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.common.util.TimeUtils;
import com.ssafy.be.global.websocket.exception.StompException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UniqueBidAuctionService {

    private final UniqueBidAuctionRepository uniqueBidAuctionRepository;
    private final UniqueBidRepository uniqueBidRepository;
    private final UserRepository userRepository;
    private final ShippingAddressRepository shippingAddressRepository;




    @Transactional
    public UniqueBidStartResponse startAuction(UniqueBidStartRequest request, Long userId) {
        UniqueBidAuction uniqueAuction = findByAuctionId(request.auctionId());


        //판매자만 시작 가능
        if (!uniqueAuction.isSeller(userId))
            throw new StompException(UniqueBidAuctionErrorCode.UNAUTHORIZED);

        //Live로 상태 변경
        uniqueAuction.start(TimeUtils.nowAsString());

        auctionTimerRepository.save(uniqueAuction.getAuctionId(), uniqueAuction.getDuration());

        return UniqueBidStartResponse.builder()
                .minPrice(uniqueAuction.getMinPrice())
                .maxPrice(uniqueAuction.getMaxPrice())
                .bidUnit(uniqueAuction.getAuction().getItem().getBidUnit())
                .durationSeconds(uniqueAuction.getDuration())
                .build();
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
        user.deductBalance(request.amount());

        return uniqueBidRepository.countParticipants(uniqueAuction.getAuctionId());
    }

    @Transactional
    public UniqueAuctionResult aggregate(UniqueBidCalculateRequest request) {
        UniqueBidAuction uniqueAuction = findByAuctionId(request.auctionId());

        if (!uniqueAuction.isLive())
            throw new StompException(UniqueBidAuctionErrorCode.INVALID_STATUS);

        // LIVE → CALCULATING (이후 placeBid 자동 차단)
        uniqueAuction.startCalculating();

        Long auctionId = uniqueAuction.getAuctionId();
        Optional<Long> winnerPrice = uniqueBidRepository.findHighestUniqueBid(auctionId);
        // TODO : top 개수 및 기준 변경 필요
        List<DuplicatePriceInfo> topDuplicates = uniqueBidRepository.findTopPriceDuplicate(auctionId, 3);

        // 유찰
        if (winnerPrice.isEmpty()) {
            uniqueAuction.unsold();
            refundAll(auctionId);
            uniqueBidRepository.deleteAll(auctionId);
            return UniqueAuctionResult.unsold(topDuplicates);
        }

        // 낙찰
        Long winnerId = uniqueBidRepository
                .findUserIdByAmount(auctionId, winnerPrice.get())
                .orElseThrow();

        uniqueAuction.sold();
        refundAllExcept(auctionId, winnerId); // 탈락자 환불
        uniqueBidRepository.deleteAll(auctionId);

        ShippingAddress shipping = shippingAddressRepository
                .findByUserIdAndIsDefaultTrue(winnerId)
                .orElseThrow(() -> new StompException(
                        ShippingAddressErrorCode.DEFAULT_SHIPPING_ADDRESS_NOT_FOUND));

        return UniqueAuctionResult.won(winnerId, winnerPrice.get(), topDuplicates, shipping);
    }

    public Long getStreamIdByAuctionId(Long auctionId) {
        return findByAuctionId(auctionId).getStreamId();
    }

    private void refundAll(Long auctionId) {
        uniqueBidRepository.getAllBids(auctionId).forEach((uid, amt) -> {
            User user = userRepository.findById(Long.parseLong(uid.toString())).orElseThrow();
            user.refundBalance(Long.parseLong(amt.toString()));
        });
    }

    private void refundAllExcept(Long auctionId, Long winnerId) {
        uniqueBidRepository.getAllBids(auctionId).forEach((uid, amt) -> {
            Long userId = Long.parseLong(uid.toString());
            if (!userId.equals(winnerId)) {
                User user = userRepository.findById(userId).orElseThrow();
                user.refundBalance(Long.parseLong(amt.toString()));
            }
        });
    }

    private UniqueBidAuction findByAuctionId(Long auctionId) {
        return uniqueBidAuctionRepository.findByAuctionId(auctionId)
                .orElseThrow(() -> new StompException(UniqueBidAuctionErrorCode.NOT_FOUND));
    }

}
