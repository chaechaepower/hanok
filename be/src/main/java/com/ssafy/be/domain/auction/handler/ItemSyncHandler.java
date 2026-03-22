package com.ssafy.be.domain.auction.handler;

import com.ssafy.be.domain.auction.dto.response.ItemSyncResponse;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.ITEM_SYNC;

@RequiredArgsConstructor
@Component
public class ItemSyncHandler implements StreamEventHandler {
    private final AuctionService auctionService;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return ITEM_SYNC;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        Long userId = Long.parseLong(principal.getName());

        // 스트림 방에 걸려있는 모든 경매 아이템 정보를 한 번에 통합 조회
        ItemSyncResponse response = auctionService.syncItem(streamId);

        streamPublisher.sendToUser(userId, streamId, ITEM_SYNC, response);
    }
}
