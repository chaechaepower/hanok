package com.ssafy.be.domain.escrow.scheduler;

import com.ssafy.be.domain.escrow.service.EscrowCancellationService;
import com.ssafy.be.domain.escrow.service.EscrowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static java.util.concurrent.Executors.newSingleThreadScheduledExecutor;

@Slf4j
@RequiredArgsConstructor
@Component
public class EscrowShipmentScheduler {
    private static final int TIMER_HOURS = 72;
    private final ScheduledExecutorService scheduler = newSingleThreadScheduledExecutor();
    private final Map<Long, ScheduledFuture<?>> scheduledEscrows = new ConcurrentHashMap<>();
    private final EscrowCancellationService escrowCancellationService;

    // 에스크로 자동 취소 스케줄 등록
    public void scheduleEscrow(Long escrowId) {
        ScheduledFuture<?> schedule = scheduler.schedule(
                () -> escrowCancellationService.autoCancelEscrow(escrowId),
                TIMER_HOURS,
                TimeUnit.HOURS
        );

        scheduledEscrows.put(escrowId, schedule);

        log.info("에스크로 자동 취소 스케줄 등록 escrowId={}", escrowId);
    }

    // 기등록된 스케줄 취소
    public void cancelScheduledEscrow(Long escrowId) {
        ScheduledFuture<?> schedule = scheduledEscrows.remove(escrowId);

        if (schedule != null && !schedule.isDone()) {
            log.info("에스크로 자동 취소 스케줄 취소 escrowId={}", escrowId);
            schedule.cancel(true);
        }
    }
}
