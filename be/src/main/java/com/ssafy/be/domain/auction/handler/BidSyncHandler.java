package com.ssafy.be.domain.auction.handler;

import com.ssafy.be.domain.auction.dto.response.BidSyncResponse;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.BID_SYNC;

@RequiredArgsConstructor
@Component
public class BidSyncHandler implements StreamEventHandler {
    private final AuctionService auctionService;
    private final StreamPublisher streamPublisher;


    @Override
    public StreamEventType getEventType() {
        return BID_SYNC;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        Long userId = Long.parseLong(principal.getName());

        BidSyncResponse response = auctionService.syncBid(streamId, userId);

        streamPublisher.sendToUser(userId, streamId, BID_SYNC, response);
    }
}
