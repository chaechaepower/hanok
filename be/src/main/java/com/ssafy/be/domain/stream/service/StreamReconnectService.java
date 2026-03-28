package com.ssafy.be.domain.stream.service;

import com.ssafy.be.domain.auction.entity.Auction;
import com.ssafy.be.domain.auction.repository.AuctionRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerPausedRepository;
import com.ssafy.be.domain.auction.repository.AuctionTimerRepository;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.repository.ItemRepository;
import com.ssafy.be.domain.stream.entity.Stream;
import com.ssafy.be.domain.stream.entity.StreamStatus;
import com.ssafy.be.domain.stream.exception.StreamErrorCode;
import com.ssafy.be.domain.stream.repository.StreamReconnectRedisRepository;
import com.ssafy.be.domain.stream.repository.StreamRepository;
import com.ssafy.be.global.exception.GlobalException;
import com.ssafy.be.global.websocket.enums.StreamEventType;
import com.ssafy.be.global.websocket.publisher.StreamPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.ssafy.be.domain.auction.entity.AuctionStatus.LIVE;

@Slf4j
@Service
@RequiredArgsConstructor
public class StreamReconnectService {

    private final StreamRepository streamRepository;
    private final StreamReconnectRedisRepository reconnectRedisRepository;
    private final StreamPublisher streamPublisher;
    private final StreamViewerService streamViewerService;
    private final ItemRepository itemRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionTimerRepository auctionTimerRepository;
    private final AuctionTimerPausedRepository auctionTimerPausedRepository;

    // 판매자 연결 끊김 처리
    @Transactional
    public void handleDisconnect(Long streamId, Long userId) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // LIVE 상태일 때만 처리
        if (stream.getStatus() != StreamStatus.LIVE) {
            return;
        }

        // 판매자 본인인지 확인
        if (!stream.getSeller().getUser().getId().equals(userId)) {
            return;
        }

        log.info("[Stream] 판매자 연결 끊김 - streamId: {}", streamId);

        // 현재 경매중인 경우, 현재 경매 남은 시간을 저장하고, 기존 ttl이 흐르던 경매 시간 데이터를 삭제
        auctionRepository.findByStreamIdAndAuctionStatus(streamId, LIVE)
                .ifPresent(auction -> {
                    // 해당 상품의 redis timer 정보 저장
                    long remainingSeconds = auctionTimerRepository.findRemainingSecondsByAuctionId(auction.getId());

                    if (remainingSeconds > 0) {
                        auctionTimerPausedRepository.save(auction.getId(), remainingSeconds); // 잔여 시간 임시 저장
                        auctionTimerRepository.delete(auction.getId());  // 해당 상품의 redis timer key 제거 - ttl 중단
                    }
                });

        // Stream 상태 PAUSED로 변경
        stream.pause();

        // Redis에 5분 타이머 시작
        reconnectRedisRepository.startTimer(streamId);

        // 시청자들에게 알림
        streamPublisher.broadcast(streamId, StreamEventType.STREAM_PAUSED, null);
    }

    // 판매자 재연결 처리
    @Transactional
    public void handleReconnect(Long streamId, Long userId) {
        Stream stream = streamRepository.findById(streamId)
                .orElseThrow(() -> new GlobalException(StreamErrorCode.STREAM_NOT_FOUND));

        // PAUSED 상태일 때만 처리
        if (stream.getStatus() != StreamStatus.PAUSED) {
            return;
        }

        // 판매자 본인인지 확인
        if (!stream.getSeller().getUser().getId().equals(userId)) {
            return;
        }

        log.info("[Stream] 판매자 재연결 성공 - streamId: {}", streamId);

        // 경매중이였다면 경매 시간 TTL 재설정
        auctionRepository.findByStreamIdAndAuctionStatus(streamId, LIVE)
                .ifPresent(auction -> {
                    // 잔여 시간 확인
                    Long remainingSeconds = auctionTimerPausedRepository.findByAuctionId(auction.getId()).orElse(null);

                    if (remainingSeconds != null && remainingSeconds > 0) {
                        auctionTimerRepository.save(auction.getId(), remainingSeconds); // 타이머 재설정
                        auctionTimerPausedRepository.delete(auction.getId()); // 잔여시간 데이터 삭제
                    }
                });

        // 타이머 취소
        reconnectRedisRepository.cancelTimer(streamId);

        // Stream 상태 LIVE로 복구
        stream.resume();

        // 시청자들에게 알림
        streamPublisher.broadcast(streamId, StreamEventType.STREAM_RESUMED, null);
    }

    @Transactional
    public void handleTimeout(Long streamId) {
        streamRepository.findById(streamId).ifPresent(stream -> {
            stream.end();
            log.info("[Stream] 상태 ENDED 변경 - streamId: {}", streamId);
        });

        // 경매중이였다면 경매 잔여시간 데이터 제거
        Auction auction = auctionRepository.findByStreamIdAndAuctionStatus(streamId, LIVE).orElse(null);

        if (auction != null) {
            auctionTimerPausedRepository.delete(auction.getId());
        }

        itemRepository.updateScheduledItemsToReadyByStreamId(streamId, ItemStatus.SCHEDULED, ItemStatus.READY);

        streamViewerService.clearViewers(streamId);
        streamPublisher.broadcast(streamId, StreamEventType.STREAM_FAILED, null);
    }
}