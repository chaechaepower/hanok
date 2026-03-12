package com.ssafy.be.domain.notification.repository;

import com.ssafy.be.domain.notification.model.Notification;
import com.ssafy.be.domain.notification.model.NotificationRedisKeys;
import com.ssafy.be.global.common.response.JsonConverter;
import com.ssafy.be.global.infra.redis.RedisOperator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class NotificationRepository {

    private final RedisOperator redisOperator;
    private final JsonConverter converter;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void save(Notification noti) {
        String notiKey = NotificationRedisKeys.getNotiKey(noti.id());
        String inboxKey = NotificationRedisKeys.getUserInboxKey(noti.userId());
        String unreadKey = NotificationRedisKeys.getUserUnreadKey(noti.userId());


        // 1. 전체 알람 내용 hash로 변환하여 저장
        Map<String, String> hashdata = converter.toHash(noti);
        redisOperator.putHashEntries(notiKey, hashdata);

        // 2. 유저 Inbox에 최신순으로 추가
        // 초단위변환에서 밀리초로 id만들어 순서 보장 강화
        // 변환에서 double -> String과 기존 밀리초 -> String 문제가 발생하여 score는 정렬용으로만
        double score = noti.id();
        redisOperator.addZSet(inboxKey, String.valueOf(noti.id()), score);

        // 3. 안읽은 알람 +1
        redisOperator.incrementValue(unreadKey);

        // 4. 알림창 개수 유지 (회의 필요)
        redisOperator.keepZSetMaxSize(inboxKey, 100);

        // 5. TTL 설정
        redisOperator.setExpire(notiKey, 30, TimeUnit.DAYS);

    }

    public List<Notification> findInboxByUserId(Long userId, long offset, long limit) {
        String inboxKey = NotificationRedisKeys.getUserInboxKey(userId);

        // 1. ZSet에서 최신순으로 ID 리스트를 가져옴
        Set<String> notifIds = redisOperator.getZSetReverseRange(inboxKey, offset, offset + limit - 1);

        if (notifIds == null || notifIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. ID 리스트를 완전한 Redis Key 리스트로 변환
        List<String> notiKeys = notifIds.stream()
                .map(id -> NotificationRedisKeys.getNotiKey(Long.parseLong(id)))
                .collect(Collectors.toCollection(ArrayList::new));

        // 3. 모든 Hash 데이터를 가져옵니다.
        List<Map<Object, Object>> pipelinedResults = redisOperator.getHashEntriesPipelined(notiKeys);

        // 4. 받아온 Map 덩어리들을 record로 변환
        return pipelinedResults.stream()
                .filter(hash -> hash != null && !hash.isEmpty()) // 혹시 삭제된 데이터면 무시
                .map(hash -> converter.fromHash(hash, Notification.class))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public void markAsRead(Long userId, Long notifId) {
        String notiKey = NotificationRedisKeys.getNotiKey(notifId);
        String unreadKey = NotificationRedisKeys.getUserUnreadKey(userId);

        // 1. 필드값만 변경
        redisOperator.updateHashField(notiKey, "isRead", "true");

        // 2. unread -1
        redisOperator.decrementValue(unreadKey);
    }

    //안읽음 카운트 조회
    public int getUnreadCount(Long userId) {
        String unreadKey = NotificationRedisKeys.getUserUnreadKey(userId);
        String countStr = redisOperator.getValue(unreadKey);

        return countStr != null ? Integer.parseInt(countStr) : 0;
    }

    //모두 읽음 처리
    public void markAllAsRead(Long userId) {
        String inboxKey = NotificationRedisKeys.getUserInboxKey(userId);
        String unreadKey = NotificationRedisKeys.getUserUnreadKey(userId);

        // 1. 인박스에 있는 모든 알림 ID
        Set<String> notifIds = redisOperator.getZSetReverseRange(inboxKey, 0, -1);

        if (notifIds != null && !notifIds.isEmpty()) {
            List<String> notiKeys = notifIds.stream()
                    .map(id -> NotificationRedisKeys.getNotiKey(Long.parseLong(id)))
                    .collect(Collectors.toCollection(ArrayList::new));

            // 2. 파이프라인으로 모두 열어서 isRead를 true
            redisOperator.updateHashFieldsPipelined(notiKeys, "isRead", "true");
        }

        // 3. 안 읽은 개수 카운터는 0으로 덮어씌워서 초기화
        redisOperator.setValue(unreadKey, "0"); // (RedisOperator에 setValue 메서드 필요)
    }

    //test용 단건 조회
    public Notification findById(Long notifId) {
        String notiKey = NotificationRedisKeys.getNotiKey(notifId);
        java.util.Map<Object, Object> hash = redisOperator.getHashEntries(notiKey);

        if (hash == null || hash.isEmpty()) {
            return null;
        }
        return converter.fromHash(hash, Notification.class);
    }

    public List<Notification> findInboxByUserIdWithCurSor(Long userId, String cursor, int limit) {
        String inboxKey = NotificationRedisKeys.getUserInboxKey(userId);
        Set<String> notiIds;

        if(cursor == null || cursor.isBlank()) {

            // 커서 없으면 첫 페이지 요청 = 최신
            // operator 세 번째 매개변수 Long이라 명시 필요
            notiIds = redisOperator.getZSetReverseRange(inboxKey, 0, limit-1L);
        } else {

            // 있으면 커서 이전의 값 = max에서 최신순으로 limit 개수 조회
            double maxScore = Double.parseDouble(cursor) -1 ;

            // offset만큼 점프하고 limit 조회
            notiIds = redisOperator.getZSetReverseRangeByScore(inboxKey, 0.0, maxScore,0, limit);
        }

        if (notiIds == null || notiIds.isEmpty()) {
            return Collections.emptyList();
        }

        // String id -> redisID
        List<String> notiKeys = notiIds.stream()
                .map(id -> NotificationRedisKeys.getNotiKey(Long.parseLong(id)))
                .collect(Collectors.toCollection(ArrayList::new));

        // redisKey -> Hash
        List<Map<Object, Object>> pipeLineResults = redisOperator.getHashEntriesPipelined(notiKeys);


        // Hash -> POJO
        return pipeLineResults.stream()
                .filter(hash -> hash != null && !hash.isEmpty())
                .map(hash -> converter.fromHash(hash, Notification.class))
                .collect(Collectors.toCollection(ArrayList::new));
    }

}
