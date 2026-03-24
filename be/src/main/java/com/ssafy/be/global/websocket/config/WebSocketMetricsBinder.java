package com.ssafy.be.global.websocket.config; // 패키지는 상황에 맞게 조절하세요

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.binder.jvm.ExecutorServiceMetrics;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

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
        Tags tags = Tags.of("type", "inbound", "pool", "clientInbound");
        new ExecutorServiceMetrics(
                inboundExecutor.getThreadPoolExecutor(),
                "websocket.inbound.channel",
                tags
        ).bindTo(meterRegistry);
    }
}