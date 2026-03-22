package com.ssafy.be.domain.uniqueaction.handler;

import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidStartRequest;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;


@RequiredArgsConstructor
@Component
public class UniqueBidStartHandler implements StreamEventHandler {

    private final UniqueBidAuctionService uniqueBidAuctionService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() { return StreamEventType.UNIQUE_AUCTION_START; }

    // 시작 핸들러
    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        UniqueBidStartRequest payload = jsonConverter.convert(
                request.getPayload(), UniqueBidStartRequest.class);

        List<StreamPublishTask> streamPublishTasks = uniqueBidAuctionService
                .startAuction(streamId, payload, Long.parseLong(principal.getName()));

        streamPublishTasks.forEach(streamPublisher::publish);
    }
}
