package com.ssafy.be.domain.bottomupauction.handler;

import com.ssafy.be.domain.bottomupauction.dto.response.AuctionStatisticsResponse;
import com.ssafy.be.domain.bottomupauction.service.BottomUpAuctionService;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.AUCTION_STATISTICS_SYNC;

@RequiredArgsConstructor
@Component
public class BottomUpAuctionStatisticsSyncHandler implements StreamEventHandler {
    private final BottomUpAuctionService bottomUpAuctionService;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return AUCTION_STATISTICS_SYNC;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        Long userId = Long.parseLong(principal.getName());

        AuctionStatisticsResponse response = bottomUpAuctionService.syncAuctionStatistics(streamId);

        streamPublisher.sendToUser(userId, streamId, AUCTION_STATISTICS_SYNC, response);
    }
}
