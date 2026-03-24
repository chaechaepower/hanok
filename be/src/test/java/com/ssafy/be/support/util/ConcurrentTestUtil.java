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

    public static void executeConcurrentBids(
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

        latch.await(10, TimeUnit.SECONDS);
        executorService.shutdown();
    }
}


