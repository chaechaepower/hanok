package com.ssafy.be.domain.bottomupauction.handler;

import com.ssafy.be.domain.bottomupauction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.bottomupauction.service.BottomUpAuctionService;
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
public class BottomUpBidPlaceHandler implements StreamEventHandler {
    private final BottomUpAuctionService bottomUpAuctionService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return StreamEventType.BID_PLACED;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        BidPlaceRequest requestPayload = jsonConverter.convert(request.getPayload(), BidPlaceRequest.class);

        List<StreamPublishTask> streamPublishTasks = bottomUpAuctionService.placeBid(requestPayload, streamId, Long.parseLong(principal.getName()));

        streamPublishTasks.forEach(streamPublisher::publish);
    }
}