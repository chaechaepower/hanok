package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.ItemIntroduceRequest;
import com.ssafy.be.domain.auction.dto.response.*;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.entity.AuctionStatus;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.exception.AuctionErrorCode;
import com.ssafy.be.domain.seller.entity.Seller;
import com.ssafy.be.domain.seller.exception.SellerErrorCode;
import com.ssafy.be.domain.seller.repository.SellerRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.exception.StompException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

import static com.ssafy.be.domain.auction.enums.Comment.*;
import static com.ssafy.be.global.websocket.enums.DestType.BROADCAST;
import static com.ssafy.be.global.websocket.enums.StreamEventType.*;


@RequiredArgsConstructor
@Service
public class AuctionService {
    private final AuctionRepository auctionRepository;
    private final StreamRepository streamRepository;
    private final SellerRepository sellerRepository;

    @Transactional
    public StreamPublishTask introduceItem(ItemIntroduceRequest request, Long streamId, Long userId) {
        // 1. 호스트인지 확인
        Seller seller = sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new StompException(SellerErrorCode.SELLER_NOT_FOUND));

        validateStreamHost(streamId, seller.getId());

        // 2. 경매 상태 '설명중'으로 변경
        Auction auction = auctionRepository.findById(request.auctionId())
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        auction.introduceAuction();

        // 3. AUCTION_COMMENT로 경매 중계 메시지 브로드캐스트
        return buildStreamPublishTask(
                BROADCAST,
                streamId,
                null,
                AUCTION_COMMENT,
                buildAuctionCommentResponse(INTRODUCE.getValue())
        );
    }

    @Transactional(readOnly = true)
    public ItemSyncResponse syncItem(Long streamId) {
        // 1. 해당 스트림의 모든 경매 아이템 조회
        List<Auction> auctions = auctionRepository.findByStreamId(streamId);

        // 2. 응답 생성
        List<ItemSyncResponse.ItemInfo> items = auctions.stream()
                .map(this::buildItemSyncInfo)
                .toList();

        return ItemSyncResponse.builder()
                .items(items)
                .build();
    }

    private void validateStreamHost(Long streamId, Long sellerId) {
        boolean isStreamHost = streamRepository.existsByIdAndSellerId(streamId, sellerId);

        if (!isStreamHost) {
            throw new StompException(AuctionErrorCode.AUCTION_UNAUTHORIZED);
        }
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

    private static AuctionCommentResponse buildAuctionCommentResponse(String message) {
        return AuctionCommentResponse.builder()
                .message(message)
                .build();
    }

    private ItemSyncResponse.ItemInfo buildItemSyncInfo(Auction auction) {
        List<String> images = Stream.of(
                        auction.getItem().getImage1(),
                        auction.getItem().getImage2(),
                        auction.getItem().getImage3()
                )
                .filter(Objects::nonNull)
                .toList();

        return ItemSyncResponse.ItemInfo.builder()
                .auctionId(auction.getId())
                .itemName(auction.getItem().getName())
                .description(auction.getItem().getDescription())
                .images(images)
                .startPrice(auction.getItem().getStartPrice())
                .auctionType(auction.getItem().getAuctionType())
                .auctionTime(auction.getItem().getAuctionDuration())
                .bidUnit(auction.getItem().getBidUnit())
                .auctionStatus(auction.getAuctionStatus())
                .finalPrice(auction.getAuctionStatus() == AuctionStatus.SOLD ? auction.getFinalPrice() : null)
                .itemCondition(auction.getItem().getItemCondition())
                .build();
    }
}
