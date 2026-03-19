package com.ssafy.be.global.extension;

import org.junit.jupiter.api.extension.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class TestReportExtension
        implements TestWatcher, BeforeEachCallback, AfterEachCallback,
        BeforeAllCallback, AfterAllCallback {

    // 리포트 전용 logger 이름
    private static final Logger log = LoggerFactory.getLogger("TEST_REPORT");
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

        // ★ 단위 테스트에서도 시스템 로그에 [현재 테스트명] 꼬리표를 달아줍니다.
        MDC.put("testName", testName);

        startTimes.put(ctx.getUniqueId(), System.currentTimeMillis());
        log.info(""); // 간격 확보용 빈 줄
        log.info("  ┌─ ▶ {}", testName);
    }

    @Override
    public void afterEach(ExtensionContext ctx) {
        // ★ 테스트 종료 시 꼬리표 제거 (다른 로그와 섞이지 않도록)
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