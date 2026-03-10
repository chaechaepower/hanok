package com.ssafy.be.auction;

import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.dto.response.StompResponse;
import com.ssafy.be.global.websocket.enums.StompType;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@RequiredArgsConstructor
@Controller
public class AuctionController {
    private final AuctionService auctionService;
    private final JsonConverter jsonConverter;
    private final SimpMessageSendingOperations messageTemplate;

    @MessageMapping("/streams/{streamId}")
    public void startAuction(
            @DestinationVariable Long streamId,
            @Payload StompRequest request,
            Principal principal
    ) {
        switch (request.getEventType()) {
            case AUCITON_START: {
                AuctionStartResponse payload = auctionService.startAuction(
                        jsonConverter.convert(request.getPayload(), AuctionStartRequest.class),
                        streamId,
                        Long.parseLong(principal.getName())
                );

                StompResponse<Object> response = StompResponse.builder()
                        .eventType(StompType.AUCITON_START)
                        .payload(payload)
                        .build();

                messageTemplate.convertAndSend("/broadcast/streams/" + streamId, response);
            }

        }
    }

}
