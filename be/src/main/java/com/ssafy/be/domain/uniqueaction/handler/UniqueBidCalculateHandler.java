package com.ssafy.be.domain.uniqueaction.handler;

import com.ssafy.be.domain.uniqueaction.dto.request.UniqueBidCalculateRequest;
import com.ssafy.be.domain.uniqueaction.dto.response.UniqueBidCalculatingResponse;
import com.ssafy.be.domain.uniqueaction.service.UniqueBidAuctionService;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.websocket.dto.StreamPublishTask;
import com.ssafy.be.global.websocket.dto.request.StompRequest;
import com.ssafy.be.global.websocket.enums.DestType;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.handler.StreamEventHandler;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

@RequiredArgsConstructor
@Component
public class UniqueBidCalculateHandler implements StreamEventHandler {

    private final UniqueBidAuctionService uniqueBidAuctionService;
    private final JsonConverter jsonConverter;
    private final StreamPublisher streamPublisher;

    @Override
    public StreamEventType getEventType() { return StreamEventType.UNIQUE_AUCTION_CALCULATING; }

    @Override
    public void handle(StompRequest<?> request, Long streamId, Principal principal) {
        UniqueBidCalculateRequest payload = jsonConverter.convert(
                request.getPayload(), UniqueBidCalculateRequest.class);

        // 1. 현재 참가자 수 조회
        long participantCount = uniqueBidAuctionService.getParticipantCount(payload.auctionId());

        // 2. 집계 시작 알림
        streamPublisher.broadcast(streamId, StreamEventType.UNIQUE_AUCTION_CALCULATING,
                new UniqueBidCalculatingResponse(participantCount));

        // 3. 집계 로직 실행 (트랜잭션 커밋까지 포함)
        List<StreamPublishTask> publishTasks = uniqueBidAuctionService.aggregate(payload);

        // 4. 트랜잭션 커밋 이후 Redis 정리 (deleteAll이 트랜잭션 내 즉시 실행되면
        //    미커밋 상태에서 SYNC 요청이 participantCount=0을 반환하는 race condition 발생)
        uniqueBidAuctionService.deleteAllBids(payload.auctionId());

        // 5. 전체 유저에게 결과 공지
        for (StreamPublishTask task : publishTasks) {
            if (task.getDestType() == DestType.BROADCAST) {
                streamPublisher.broadcast(task.getStreamId(), task.getEventType(), task.getPayload());
            } else if (task.getDestType() == DestType.PRIVATE) {
                streamPublisher.sendToUser(task.getUserId(), task.getStreamId(), task.getEventType(), task.getPayload());
            }

        }
    }
}