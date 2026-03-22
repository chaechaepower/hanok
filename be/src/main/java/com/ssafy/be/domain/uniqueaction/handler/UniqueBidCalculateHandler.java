package com.ssafy.be.domain.uniqueaction.handler;

import com.ssafy.be.domain.auction.dto.response.BidWinnerResponse;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.uniqueaction.dto.model.UniqueAuctionResult;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueAuctionResultResponse;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidCalculatingResponse;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@RequiredArgsConstructor
@Component
public class UniqueBidCalculateHandler implements StreamEventHandler {

    private final UniqueBidAuctionService uniqueBidAuctionService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() { return StreamEventType.UNIQUE_AUCTION_CALCULATING; }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        UniqueBidCalculateRequest payload = jsonConverter.convert(
                request.getPayload(), UniqueBidCalculateRequest.class);

        // 1. 현재 참가자 수 조회
        long participantCount = uniqueBidAuctionService.getParticipantCount(payload.auctionId());

        // 2. 집계 시작 알림
        streamPublisher.broadcast(streamId, StreamEventType.UNIQUE_AUCTION_CALCULATING,
                new UniqueBidCalculatingResponse(participantCount));

        // 3. 집계 로직 실행
        UniqueAuctionResult result = uniqueBidAuctionService.aggregate(payload);

        // 4. 전체 유저에게 결과 공지
        streamPublisher.broadcast(streamId, StreamEventType.UNIQUE_AUCTION_END,
                buildResultResponse(result));

        // 5. 우승자에게 상세 정보 전송
        if (result.isWon()) {
            streamPublisher.sendToUser(result.winnerId(), streamId, StreamEventType.BID_WINNER,
                    buildWinnerResponse(result));
        }
    }

    private UniqueAuctionResultResponse buildResultResponse(UniqueAuctionResult result) {
        return UniqueAuctionResultResponse.builder()
                .isWon(result.isWon())
                .winnerPrice(result.isWon() ? result.winnerPrice() : null)
                .topDuplicates(result.topDuplicates())
                .build();
    }

    private BidWinnerResponse buildWinnerResponse(UniqueAuctionResult result) {
        ShippingAddress s = result.shippingAddress();
        return BidWinnerResponse.builder()
                .item(BidWinnerResponse.ItemDto.builder()
                        .itemName("유일가 경매 낙찰")
                        .finalPrice(result.winnerPrice())
                        .build())
                .shipping(BidWinnerResponse.ShippingDto.builder()
                        .recipientName(s.getRecipientName())
                        .addressName(s.getAddressName())
                        .postalCode(s.getPostalCode())
                        .address(s.getAddress())
                        .addressDetail(s.getAddressDetail())
                        .phone(s.getPhone())
                        .build())
                .build();
    }
}