package com.ssafy.be.domain.auction.handler;

import com.ssafy.be.domain.auction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.auction.dto.response.BidPlaceResponse;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.BID_PLACED;

@RequiredArgsConstructor
@Component
public class BidPlaceHandler implements StreamEventHandler {
    private final AuctionService auctionService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return StreamEventType.BID_PLACED;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        BidPlaceRequest requestPayload = jsonConverter.convert(request.getPayload(), BidPlaceRequest.class);

        BidPlaceResponse responsePayload = auctionService.placeBid(requestPayload, streamId, Long.parseLong(principal.getName()));

        streamPublisher.broadcastToStream(streamId, BID_PLACED, responsePayload);
    }
}