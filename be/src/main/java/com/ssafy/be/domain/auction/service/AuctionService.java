package com.ssafy.be.domain.auction.service;

import com.ssafy.be.domain.auction.dto.request.ItemIntroduceRequest;
import com.ssafy.be.domain.auction.dto.response.*;
import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.bottomupauction.exception.AuctionErrorCode;
import com.ssafy.be.domain.item.entity.AuctionType;
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

        // 2. 경매가 준비중 상태인지 검증
        Auction auction = auctionRepository.findById(request.auctionId())
                .orElseThrow(() -> new StompException(AuctionErrorCode.AUCTION_NOT_FOUND));

        validateReadyAuction(auction);

        // 3. 경매 상태 '설명중'으로 변경
        auction.introduceAuction();

        // 4. AUCTION_COMMENT로 경매 중계 메시지 브로드캐스트
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
        // 1. 해당 스트림의 모든 경매 아이템을 한 번에 조회
        List<Auction> auctions = auctionRepository.findByStreamId(streamId);

        // 2. 상향식/유일최고가 구분 없이 모두 단일 응답 DTO로 매핑
        List<ItemSyncResponse.ItemInfo> items = auctions.stream()
                .map(this::buildItemSyncInfo)
                .toList();

        return ItemSyncResponse.builder()
                .items(items)
                .build();
    }

    private ItemSyncResponse.ItemInfo buildItemSyncInfo(Auction auction) {
        // 이미지 리스트 추출
        List<String> images = java.util.stream.Stream.of(
                        auction.getItem().getImage1(),
                        auction.getItem().getImage2(),
                        auction.getItem().getImage3()
                )
                .filter(java.util.Objects::nonNull)
                .toList();

        // 경매 타입 변수화
        boolean isBottomUp = auction.getAuctionType() == AuctionType.BOTTOM_UP;
        boolean isUniqueTop = auction.getAuctionType() == AuctionType.UNIQUE_TOP;

        // 낙찰 확정된 가격 뽑기 로직 공통화
        Long finalPrice = null;
        if (auction.getAuctionStatus() == com.ssafy.be.domain.auction.entity.AuctionStatus.SOLD ||
                auction.getAuctionStatus() == com.ssafy.be.domain.auction.entity.AuctionStatus.CALCULATING) {
            finalPrice = auction.getFinalPrice();
        }

        // 공통 DTO를 만들고 본인 타입에 맞는 속성만 채워넣기
        return ItemSyncResponse.ItemInfo.builder()
                .auctionId(auction.getId())
                .itemName(auction.getItem().getName())
                .description(auction.getItem().getDescription())
                .images(images)
                .auctionType(auction.getAuctionType())
                .auctionTime(auction.getAuctionDuration())
                .auctionStatus(auction.getAuctionStatus())
                .finalPrice(finalPrice)
                .itemCondition(auction.getItem().getItemCondition())

                // 타입별 다형성 데이터 투입 분기
                .bidUnit(isBottomUp && auction.getBottomUpAuctionDetail() != null ?
                        auction.getBottomUpAuctionDetail().getBidUnit() : null)
                .startPrice(isBottomUp && auction.getBottomUpAuctionDetail() != null ?
                        auction.getBottomUpAuctionDetail().getStartPrice() : null)
                .minPrice(isUniqueTop && auction.getUniqueBidAuctionDetail() != null ?
                        auction.getUniqueBidAuctionDetail().getMinPrice() : null)
                .maxPrice(isUniqueTop && auction.getUniqueBidAuctionDetail() != null ?
                        auction.getUniqueBidAuctionDetail().getMaxPrice() : null)
                .build();
    }


    private void validateStreamHost(Long streamId, Long sellerId) {
        boolean isStreamHost = streamRepository.existsByIdAndSellerId(streamId, sellerId);

        if (!isStreamHost) {
            throw new StompException(AuctionErrorCode.AUCTION_UNAUTHORIZED);
        }
    }

    private void validateReadyAuction(Auction auction) {
        if (!auction.isReady()) {
            throw new StompException(AuctionErrorCode.AUCTION_NOT_READY);
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
}
