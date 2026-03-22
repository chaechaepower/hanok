package com.ssafy.be.domain.bottomupauction.handler;

import com.ssafy.be.domain.auction.dto.response.ItemSyncResponse;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.domain.bottomupauction.service.BottomUpAuctionService;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.BOTTOM_UP_ITEM_SYNC;

@RequiredArgsConstructor
@Component
public class BottomUpItemSyncHandler implements StreamEventHandler {
    private final BottomUpAuctionService bottomUpAuctionService;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return BOTTOM_UP_ITEM_SYNC;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        Long userId = Long.parseLong(principal.getName());

        ItemSyncResponse response = bottomUpAuctionService.syncItem(streamId);

        streamPublisher.sendToUser(userId, streamId, BOTTOM_UP_ITEM_SYNC, response);
    }
}
