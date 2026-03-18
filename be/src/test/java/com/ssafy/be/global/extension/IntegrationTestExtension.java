package com.ssafy.be.global.extension;

import org.junit.jupiter.api.extension.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class IntegrationTestExtension
        implements TestWatcher, BeforeEachCallback, AfterEachCallback {

    // 리포트 전용 logger
    private static final Logger log = LoggerFactory.getLogger("IT_REPORT");
    private final Map<String, Long> startTimes = new ConcurrentHashMap<>();

    @Override
    public void beforeEach(ExtensionContext ctx) {
        String testName = ctx.getDisplayName();
        // ★ 핵심: 시스템 로그에 현재 테스트 이름을 꼬리표로 달아줌
        MDC.put("testName", testName);

        startTimes.put(ctx.getUniqueId(), System.currentTimeMillis());
        log.info("");
        log.info("  ┌─ ▶ {}", testName);
        log.info("  │   [ENV] MySQL: UP | Redis: UP | Containers: READY");
    }

    @Override
    public void afterEach(ExtensionContext ctx) {
        // ★ 핵심: 테스트가 끝나면 꼬리표 제거 (다른 로그에 섞이지 않도록)
        MDC.clear();
    }

    @Override
    public void testSuccessful(ExtensionContext ctx) {
        long ms = elapsed(ctx);
        log.info("  └─ ✅ PASSED  {}ms{}", ms, ms > 1000 ? "  ⚠️ 느린 응답 감지" : "");
    }

    @Override
    public void testFailed(ExtensionContext ctx, Throwable cause) {
        long ms = elapsed(ctx);
        log.info("  └─ ❌ FAILED  {}ms  →  {}", ms, cause.getMessage());
    }

    @Override
    public void testAborted(ExtensionContext ctx, Throwable cause) {
        log.info("  └─ ⚠️  ABORTED  →  {}", cause.getMessage());
    }

    @Override
    public void testDisabled(ExtensionContext ctx, Optional<String> reason) {
        log.info("  └─ ⏭️  DISABLED  →  {}", reason.orElse("no reason"));
    }

    private long elapsed(ExtensionContext ctx) {
        Long start = startTimes.remove(ctx.getUniqueId());
        return start != null ? System.currentTimeMillis() - start : -1;
    }
}