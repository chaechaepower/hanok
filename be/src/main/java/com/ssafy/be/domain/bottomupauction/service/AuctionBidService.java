package com.ssafy.be.domain.bottomupauction.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.bottomupauction.entity.BottomUpAuctionDetail;
import com.ssafy.be.domain.bottomupauction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.bottomupauction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.bottomupauction.exception.AuctionErrorCode;
import com.ssafy.be.domain.bottomupauction.model.Bid;
import com.ssafy.be.domain.bottomupauction.repository.AuctionBidRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.domain.user.exception.UserErrorCode;
import com.ssafy.be.domain.user.repository.UserRepository;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Service
public class AuctionBidService {
    private final AuctionBidRepository auctionBidRepository;
    private final UserRepository userRepository;

    public BidPlaceResponse.BidInfoDto saveBid(BidPlaceRequest request, Auction auction, User currentBidder) {
        // 1. 입찰가 검증 -> 기존 입찰이 존재하면 요청 입찰 > 기존 입찰(최고가) / 없다면 요청 입찰 > 시작가
        Bid previousTopBid = auctionBidRepository.findTopBid(auction.getId())
                .orElse(null);

        if (previousTopBid == null) {
            validateMoreThanStartPrice(request, auction);
        } else {
            validateHigherOrEqualToPreviousTopBid(request, previousTopBid);
        }

        // 2. 입찰 저장
        Bid currentTopBid = Bid.builder()
                .userId(currentBidder.getId())
                .nickname(currentBidder.getNickname())
                .amount(request.amount())
                .bidAt(LocalDateTime.now())
                .build();

        auctionBidRepository.save(auction.getId(), currentTopBid);

        // 3. 입찰 예치, 기존 최고 입찰자(있다면)의 입찰 예치 롤백
        processBidDeposit(request, currentBidder, previousTopBid);

        // 3. 응답
        return buildBidInfoDto(currentTopBid);
    }

    private void processBidDeposit(BidPlaceRequest request, User currentBidder, Bid previousTopBid) {
        if (previousTopBid != null) {
            User previousTopBidder = userRepository.findById(previousTopBid.userId())
                    .orElseThrow(() -> new StompException(UserErrorCode.USER_NOT_FOUND));

            previousTopBidder.cancelDepositedBidBalance(previousTopBid.amount());
        }

        currentBidder.depositBidBalance(request.amount());
    }

    private static void validateHigherOrEqualToPreviousTopBid(BidPlaceRequest request, Bid previousTopBid) {
        if (previousTopBid.isHigherThanOrEqualTo(request.amount())) {
            throw new StompException(AuctionErrorCode.AUCTION_BID_TOO_LOW);
        }
    }

    private static void validateMoreThanStartPrice(BidPlaceRequest request, Auction auction) {
        BottomUpAuctionDetail detail = auction.getBottomUpAuctionDetail();

        if (detail.isBelowStartPrice(request.amount())) {
            throw new StompException(AuctionErrorCode.AUCTION_BID_BELOW_START_PRICE);
        }
    }

    private static BidPlaceResponse.BidInfoDto buildBidInfoDto(Bid bid) {
        return BidPlaceResponse.BidInfoDto.builder()
                .nickname(bid.nickname())
                .amount(bid.amount())
                .placedAt(bid.bidAt())
                .build();
    }
}
