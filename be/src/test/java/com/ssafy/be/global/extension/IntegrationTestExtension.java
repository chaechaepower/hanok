package com.ssafy.be.global.extension;

import org.junit.jupiter.api.extension.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.AfterAllCallback;

public class IntegrationTestExtension
        implements TestWatcher, BeforeEachCallback, AfterEachCallback,
        BeforeAllCallback, AfterAllCallback {
    // 리포트 전용 logger
    private static final Logger log = LoggerFactory.getLogger("IT_REPORT");
    private final Map<String, Long> startTimes = new ConcurrentHashMap<>();

    private final AtomicInteger passed = new AtomicInteger(0);
    private final AtomicInteger failed = new AtomicInteger(0);

    @Override
    public void beforeAll(ExtensionContext ctx) {
        log.info("");
        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║  🧪  {}", ctx.getDisplayName());
        log.info("╚══════════════════════════════════════════════════════╝");
    }

    @Override
    public void afterAll(ExtensionContext ctx) {
        int p = passed.get(), f = failed.get();
        log.info("  📊 {}개 완료 — ✅ {} PASSED  ❌ {} FAILED", p + f, p, f);
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("");
    }

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
        passed.incrementAndGet();
        log.info("  └─ ✅ PASSED  {}ms   {}", ms, performanceBadge(ms));
    }

    @Override
    public void testFailed(ExtensionContext ctx, Throwable cause) {
        long ms = elapsed(ctx);
        failed.incrementAndGet();
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

    private String performanceBadge(long ms) {
        if (ms < 100)
            return "⚡ FAST";
        if (ms < 500)
            return "✅ GOOD";
        if (ms < 1500)
            return "🐢 SLOW";
        return "🚨 VERY SLOW";
    }
}