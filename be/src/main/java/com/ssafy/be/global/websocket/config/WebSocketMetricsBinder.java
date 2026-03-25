package com.ssafy.be.global.websocket.config;
import io.micrometer.core.instrument.FunctionCounter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadPoolExecutor;

@Component
public class WebSocketMetricsBinder {

    private final ThreadPoolTaskExecutor inboundExecutor;
    private final MeterRegistry meterRegistry;

    // Spring이 자동 생성한 웹소켓 스레드 풀 빈을 Qualifier로 명시하여 주입
    public WebSocketMetricsBinder(
            @Qualifier("clientInboundChannelExecutor") ThreadPoolTaskExecutor inboundExecutor,
            MeterRegistry meterRegistry) {
        this.inboundExecutor = inboundExecutor;
        this.meterRegistry = meterRegistry;
    }

    // 애플리케이션이 완전히 구동된 직후 메트릭을 바인딩
    @EventListener(ApplicationReadyEvent.class)
    public void bindMetrics() {
        inboundExecutor.initialize();

        ThreadPoolExecutor tpe = inboundExecutor.getThreadPoolExecutor();

        // ✅ executor.* 와 겹치지 않는 완전히 다른 이름으로 직접 Gauge 등록
        Tags tags = Tags.of(
                "application", "hanok-backend",
                "namespace", "production"
        );

        Gauge.builder("ws.inbound.pool.size", tpe, ThreadPoolExecutor::getPoolSize)
                .tags(tags).register(meterRegistry);
        Gauge.builder("ws.inbound.active.threads", tpe, ThreadPoolExecutor::getActiveCount)
                .tags(tags).register(meterRegistry);
        Gauge.builder("ws.inbound.queued.tasks", tpe, e -> e.getQueue().size())
                .tags(tags).register(meterRegistry);
        FunctionCounter.builder("ws.inbound.completed.tasks", tpe, ThreadPoolExecutor::getCompletedTaskCount)
                .tags(tags).register(meterRegistry);
    }
}