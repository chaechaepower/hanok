import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const BASE     = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const SELLER_ID = 7;

const sseConnectRate    = new Rate('sse_connect_success');
const notifySuccessRate = new Rate('notify_trigger_success');
const notifyDuration    = new Trend('notify_trigger_duration_ms', true);
const sseEventCount     = new Counter('sse_event_received');

export const options = {
  tags: { domain: 'notification', scenario: 'smoke' },
  setupTimeout: '300s',
  vus: 6,
  duration: '1m',
  thresholds: {
    http_req_failed:     ['rate<0.05'],
    sse_connect_success: ['rate==1.0'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);

  // follower 4명 팔로우
  for (let i = 1; i <= 4; i++) {
    const res = http.post(
      `${BASE}/follow/${SELLER_ID}`,
      null,
      { headers: { Authorization: tokens[i] } }
    );
    console.log(`follower ${i} 팔로우: ${res.status}`);
  }

  return { tokens };
}

export default function (data) {
  const { tokens } = data;

  if (__VU === 1) {
    // ─── seller VU ───────────────────────────────────────
    const sseRes = http.get(`${BASE}/sse/subscribe`, {
      headers: {
        Authorization: tokens[0],
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      responseType: 'text',
      timeout: '35s',
      tags: { api: 'sse_subscribe' },
    });
    check(sseRes, { '[Smoke] seller SSE 200': (r) => r.status === 200 });

    sleep(2);

    // 공지 작성 → 팔로워 알림 트리거
    const noticeRes = http.post(
      `${BASE}/sellers/${SELLER_ID}/notices`,
      JSON.stringify({
        title: `k6 smoke 공지 ${Date.now()}`,
        content: '스모크 테스트용 공지입니다.',
      }),
      {
        headers: { Authorization: tokens[0], 'Content-Type': 'application/json' },
        tags: { api: 'create_notice' },
      }
    );

    const triggered = check(noticeRes, {
      '[Smoke] 공지 작성 200': (r) => r.status === 200,
    });
    notifySuccessRate.add(triggered);
    notifyDuration.add(noticeRes.timings.duration);
    console.log(`📢 공지 작성: ${noticeRes.status}, ${noticeRes.timings.duration}ms`);

  } else {
    // ─── follower VU ─────────────────────────────────────
    const token = tokens[__VU - 1];

    const sseRes = http.get(`${BASE}/sse/subscribe`, {
      headers: {
        Authorization: token,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      responseType: 'text',
      timeout: '35s',
      tags: { api: 'sse_subscribe' },
    });

    const connected = check(sseRes, {
      '[Smoke] follower SSE 200':      (r) => r.status === 200,
      '[Smoke] connected 이벤트 수신': (r) => r.body?.includes('connected!'),
    });
    sseConnectRate.add(connected);

    if (sseRes.body) {
      const eventCount = (sseRes.body.match(/^data:/gm) || []).length;
      sseEventCount.add(eventCount);
      console.log(`✅ VU${__VU} SSE 이벤트 ${eventCount}개 수신`);
    }
  }

  sleep(2);
}

export function handleSummary(data) {
  return generateSummary(data, 'notification_01_smoke');
}