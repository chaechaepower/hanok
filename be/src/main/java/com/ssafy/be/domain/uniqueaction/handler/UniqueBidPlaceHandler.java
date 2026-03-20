//package com.ssafy.be.domain.uniqueaction.handler;
//
//import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidPlaceRequest;
//import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidAckResponse;
//import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidStatsResponse;
//import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
//import com.ssafy.be.global.common.response.JsonConverter;
//import com.ssafy.be.global.websocket.dto.request.StompRequest;
//import com.ssafy.be.global.websocket.enums.StreamEventType;
//import com.ssafy.be.global.websocket.handler.StreamEventHandler;
//import com.ssafy.be.global.websocket.publisher.StreamPublisher;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Component;
//
//import java.security.Principal;
//
//
//
//@RequiredArgsConstructor
//@Component
//public class UniqueBidPlaceHandler implements StreamEventHandler {
//
//    private final UniqueBidAuctionService uniqueBidAuctionService;
//    private final JsonConverter jsonConverter;
//    private final StreamPublisher streamPublisher;
//
//    @Override
//    public StreamEventType getEventType() { return StreamEventType.UNIQUE_BID_PLACE; }
//
//    @Override
//    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
//        UniqueBidPlaceRequest payload = jsonConverter.convert(
//                request.getPayload(), UniqueBidPlaceRequest.class);
//        Long userId = Long.parseLong(principal.getName());
//
//        long participantCount = uniqueBidAuctionService.placeBid(payload, userId);
//
//        // 본인에게 입찰 접수 확인 필요한가 ?
//        streamPublisher.sendToUser(userId, streamId, StreamEventType.UNIQUE_BID_ACK,
//                new UniqueBidAckResponse(payload.amount()));
//
//        // 전체에게 참가자 수
//        streamPublisher.broadcast(streamId, StreamEventType.UNIQUE_AUCTION_STATS,
//                new UniqueBidStatsResponse(participantCount));
//    }
//}