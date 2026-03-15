package com.ssafy.be.domain.uniqueaction.handler;

import com.ssafy.be.domain.auction.dto.response.BidWinnerResponse;
import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;
import com.ssafy.be.domain.uniqueaction.dto.model.UniqueAuctionResult;
import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueAuctionResultResponse;
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

        // 집계 시작 알림
        streamPublisher.broadcast(streamId, StreamEventType.UNIQUE_AUCTION_CALCULATING, null);

        // 집계
        UniqueAuctionResult result = uniqueBidAuctionService.aggregate(payload);

        // 결과 출력
        streamPublisher.broadcast(streamId, StreamEventType.UNIQUE_AUCTION_END,
                buildResultResponse(result));

        // 우승자에게 따로 보내야 하는가 ?
//        if (result.isWon()) {
//            streamPublisher.sendToUser(result.winnerId(), streamId, StreamEventType.BID_WINNER,
//                    buildWinnerResponse(result));
//        }
    }

    private UniqueAuctionResultResponse buildResultResponse(UniqueAuctionResult result) {
        return UniqueAuctionResultResponse.builder()
                .isWon(result.isWon())
                .winnerPrice(result.winnerPrice())
                .topDuplicates(result.topDuplicates())
                .build();
    }

    private BidWinnerResponse buildWinnerResponse(UniqueAuctionResult result) {
        ShippingAddress s = result.shippingAddress();
        return BidWinnerResponse.builder()
                .item(BidWinnerResponse.ItemDto.builder()
                        .itemName(result.winnerPrice().toString())
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