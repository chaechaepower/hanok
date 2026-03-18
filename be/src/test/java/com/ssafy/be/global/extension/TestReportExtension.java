package com.ssafy.be.global.extension;

import org.junit.jupiter.api.extension.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class TestReportExtension
        implements TestWatcher, BeforeEachCallback, AfterEachCallback {

    // 리포트 전용 logger 이름
    private static final Logger log = LoggerFactory.getLogger("TEST_REPORT");
    private final Map<String, Long> startTimes = new ConcurrentHashMap<>();

    @Override
    public void beforeEach(ExtensionContext ctx) {
        startTimes.put(ctx.getUniqueId(), System.currentTimeMillis());
        log.info("");
        log.info("  ┌─ ▶ {}", ctx.getDisplayName());
    }

    @Override
    public void afterEach(ExtensionContext ctx) {
        // 결과는 TestWatcher 콜백에서 출력
    }

    @Override
    public void testSuccessful(ExtensionContext ctx) {
        long ms = elapsed(ctx);
        log.info("  └─ ✅ PASSED  {}ms", ms);
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
