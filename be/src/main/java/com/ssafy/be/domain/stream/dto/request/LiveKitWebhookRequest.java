package com.ssafy.be.domain.stream.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LiveKitWebhookRequest(
        String event,
        RoomInfo room,
        ParticipantInfo participant
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RoomInfo(String name) {}  // name = streamId

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ParticipantInfo(String identity) {}  // identity = userId
}