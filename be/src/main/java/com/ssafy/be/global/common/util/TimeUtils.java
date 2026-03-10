package com.ssafy.be.global.common.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public final class TimeUtils {
    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter KST_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private TimeUtils() {}

    /*
    * 현재 KST 시각
    * 시스템 시각을 읽어서 Asia/Seoul 타임존 기준으로 변환 → (날짜, 시각, 나노초, 타임존 오프셋) 전부 포함된 객체
    * ex) 2026-03-09T14:00:00.123456789+09:00[Asia/Seoul]
    * */
    public static ZonedDateTime now() {
        return ZonedDateTime.now(KST_ZONE);
    }

    /*
     * ZonedDateTime → ISO-8601 문자열로 직렬화
     * "2026-03-09T14:00:00.123456789+09:00"
     */
    public static String format(ZonedDateTime dateTime) {
        return dateTime.format(KST_FORMATTER);
    }

    // LocalDateTime → ISO-8601 문자열
    public static String format(LocalDateTime dateTime) {
        return dateTime.atZone(KST_ZONE).format(KST_FORMATTER);
    }

    // 현재 KST 시각을 바로 문자열로
    public static String nowAsString() {
        return format(now());
    }
}
