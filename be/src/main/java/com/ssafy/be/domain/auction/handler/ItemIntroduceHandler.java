package com.ssafy.be.domain.auction.handler;

import com.ssafy.be.domain.auction.dto.request.ItemIntroduceRequest;
import com.ssafy.be.domain.auction.service.AuctionService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.ITEM_INTRODUCE;

@RequiredArgsConstructor
@Component
public class ItemIntroduceHandler implements StreamEventHandler {
    private final AuctionService auctionService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return ITEM_INTRODUCE;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        ItemIntroduceRequest requestPayload = jsonConverter.convert(request.getPayload(), ItemIntroduceRequest.class);

        StreamPublishTask streamPublishTask = auctionService.introduceItem(requestPayload, streamId, Long.parseLong(principal.getName()));

        streamPublisher.broadcast(streamId, ITEM_INTRODUCE, null);
        streamPublisher.publish(streamPublishTask);
    }
}
