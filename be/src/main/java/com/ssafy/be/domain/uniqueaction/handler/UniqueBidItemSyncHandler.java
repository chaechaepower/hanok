package com.ssafy.be.domain.uniqueaction.handler;

import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidItemSyncResponse;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@RequiredArgsConstructor
@Component
public class UniqueBidItemSyncHandler implements StreamEventHandler {
    private final UniqueBidAuctionService uniqueBidAuctionService;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return StreamEventType.UNIQUE_TOP_ITEM_SYNC;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        Long userId = Long.parseLong(principal.getName());

        UniqueBidItemSyncResponse response = uniqueBidAuctionService.syncItem(streamId);

        streamPublisher.sendToUser(userId, streamId, StreamEventType.UNIQUE_TOP_ITEM_SYNC, response);
    }
}
