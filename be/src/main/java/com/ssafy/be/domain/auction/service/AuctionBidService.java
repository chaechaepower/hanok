package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.exception.AuctionErrorCode;
import com.ssafy.be.domain.auction.model.Bid;
import com.ssafy.be.domain.auction.repository.AuctionBidRepository;
import com.ssafy.be.domain.user.entity.User;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Service
public class AuctionBidService {
    private final AuctionBidRepository auctionBidRepository;

    public BidPlaceResponse.BidInfoDto saveBid(BidPlaceRequest request, Auction auction, User user) {
        // 1. 입찰가 검증 -> 기존 입찰이 존재하면 요청 입찰 > 기존 입찰(최고가) / 없다면 요청 입찰 > 시작가
        validateBidAmount(request, auction);

        // 2. 입찰 저장
        Bid bid = Bid.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .amount(request.amount())
                .bidAt(LocalDateTime.now())
                .build();

        auctionBidRepository.save(auction.getId(), bid);

        // 3. 응답
        return buildBidInfoDto(bid);
    }

    private void validateBidAmount(BidPlaceRequest request, Auction auction) {
        auctionBidRepository.findTopBid(auction.getId())
                .ifPresentOrElse(
                        topBid -> {
                            if (topBid.isHigherThanOrEqualTo(request.amount())) {
                                throw new StompException(AuctionErrorCode.AUCTION_BID_TOO_LOW);
                            }
                        },
                        () -> {
                            if (auction.isBelowStartPrice(request.amount())) {
                                throw new StompException(AuctionErrorCode.AUCTION_BID_BELOW_START_PRICE);
                            }
                        }
                );
    }

    private static BidPlaceResponse.BidInfoDto buildBidInfoDto(Bid bid) {
        return BidPlaceResponse.BidInfoDto.builder()
                .nickname(bid.nickname())
                .amount(bid.amount())
                .placedAt(bid.bidAt())
                .build();
    }
}
