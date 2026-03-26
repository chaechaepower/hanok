package com.ssafy.be.support.util;

import com.ssafy.be.domain.bottomupauction.dto.request.BidPlaceRequest;
import com.ssafy.be.domain.user.entity.User;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
public class ConcurrentTestUtil {
    @FunctionalInterface
    public interface BidPlaceTask {
        void bid(BidPlaceRequest request, Long streamId, Long userId) throws Exception;
    }

    /**
     * 동시 입찰을 실행하고, 예외 없이 완료된 스레드 수를 반환한다.
     * (비즈니스 실패로 던진 예외도 여기서는 실패로 집계된다.)
     */
    public static int executeConcurrentBids(
            BidPlaceRequest request,
            Long streamId,
            List<User> bidders,
            BidPlaceTask bidTask
    ) throws InterruptedException {

        AtomicInteger successCount = new AtomicInteger(0);
        ExecutorService executorService = Executors.newFixedThreadPool(32);
        CountDownLatch latch = new CountDownLatch(bidders.size());

        for (int i = 0; i < bidders.size(); i++) {
            final int index = i;

            executorService.submit(() -> {
                try {
                    bidTask.bid(request, streamId, bidders.get(index).getId());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    log.error("경매 입찰 실패 ", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(120, TimeUnit.SECONDS);
        executorService.shutdown();
        executorService.awaitTermination(60, TimeUnit.SECONDS);
        return successCount.get();
    }

    @FunctionalInterface
    public interface WithdrawRequestTask {
        void run() throws Exception;
    }

    /**
     * 동일 작업을 taskCount만큼 동시에 실행하고, 예외 없이 완료된 횟수를 반환한다.
     */
    public static int executeConcurrentWithdrawRequests(int taskCount, WithdrawRequestTask task)
            throws InterruptedException {

        AtomicInteger successCount = new AtomicInteger(0);
        ExecutorService executorService = Executors.newFixedThreadPool(32);
        CountDownLatch latch = new CountDownLatch(taskCount);

        for (int i = 0; i < taskCount; i++) {
            executorService.submit(() -> {
                try {
                    task.run();
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    log.error("출금 요청 실패 ", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(120, TimeUnit.SECONDS);
        executorService.shutdown();
        executorService.awaitTermination(60, TimeUnit.SECONDS);
        return successCount.get();
    }
}


