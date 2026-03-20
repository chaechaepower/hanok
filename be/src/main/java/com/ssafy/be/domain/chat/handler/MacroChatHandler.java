package com.ssafy.be.domain.chat.handler;

import com.ssafy.be.domain.chat.dto.payload.MacroTemplatePayload;
import com.ssafy.be.domain.chat.dto.request.MacroTemplateRequest;
import com.ssafy.be.domain.chat.service.MacroService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;

import static com.ssafy.be.global.websocket.enums.StreamEventType.MACRO_TEMPLATE;

@RequiredArgsConstructor
@Component
public class MacroChatHandler implements StreamEventHandler {
    private final MacroService macroService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() {
        return MACRO_TEMPLATE;
    }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        MacroTemplateRequest payload =
                jsonConverter.convert(request.getPayload(), MacroTemplateRequest.class);

        Long userId = Long.parseLong(principal.getName());
        MacroTemplatePayload responsePayload = macroService.handleMacro(streamId, payload);

        streamPublisher.sendToUser(userId, streamId, MACRO_TEMPLATE, responsePayload);    }




}
