import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import exec from 'k6/execution';
import { loginAll } from '../shared/auth.js';
import { generateStressSummary } from '../shared/summary.js';

const BASE         = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const SELLER_ID    = 7;
const BASELINE_VUS = parseInt(__ENV.BASELINE || '1000');

// ── SSE 구독 관련 ────────────────────────────────────────
const sseConnectSuccess  = new Rate('sse_connect_success');
const sseConnectDuration = new Trend('sse_connect_duration_ms',  true);
const sseEventCount      = new Counter('sse_event_received');
const sseEventPerConn    = new Trend('sse_event_per_connection',  true); // 연결당 수신 이벤트 수

// ── 공지 push 관련 ───────────────────────────────────────
const notifySuccess      = new Rate('notify_trigger_success');
const notifyDuration     = new Trend('notify_trigger_duration_ms', true); // 전체 push 시간

// ── 부하 단계별 상관관계 ─────────────────────────────────
const notifyDurationLow  = new Trend('notify_duration_low_vus',  true); // VU < 500
const notifyDurationMid  = new Trend('notify_duration_mid_vus',  true); // VU 500~999
const notifyDurationHigh = new Trend('notify_duration_high_vus', true); // VU >= 1000

// ── Breaking Point ───────────────────────────────────────
const sseFailVUs         = new Trend('sse_fail_vus',             true); // SSE 실패 시점 VU 수
const notifyFailVUs      = new Trend('notify_fail_vus',          true); // 공지 실패 시점 VU 수

export const options = {
  tags: { domain: 'notification', scenario: 'stress' },
  setupTimeout: '300s',
  scenarios: {
    followers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: BASELINE_VUS },
        { duration: '3m', target: BASELINE_VUS },
        { duration: '2m', target: Math.floor(BASELINE_VUS * 1.5) },
        { duration: '3m', target: Math.floor(BASELINE_VUS * 1.5) },
        { duration: '1m', target: 0 },
      ],
      exec: 'followerScenario',
    },
    seller: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '30s',
      duration: '11m',
      preAllocatedVUs: 1,
      maxVUs: 2,
      exec: 'sellerScenario',
    },
  },
  thresholds: {
    http_req_failed:            ['rate<0.05'],
    sse_connect_success:        ['rate>0.95'],
    sse_connect_duration_ms:    ['p(95)<35000'],
    notify_trigger_duration_ms: ['p(95)<10000'],
    // ✅ VU 구간별 notify 지연
    notify_duration_low_vus:    ['p(95)<1000'],   // 저부하 구간 1s 이내
    notify_duration_mid_vus:    ['p(95)<3000'],   // 중부하 구간 3s 이내
    notify_duration_high_vus:   ['p(95)<10000'],  // 고부하 구간 10s 이내
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);

  for (let i = 1; i < tokens.length; i++) {
    http.post(
      `${BASE}/follow/${SELLER_ID}`,
      null,
      { headers: { Authorization: tokens[i] } }
    );
    if (i % 100 === 0) console.log(`팔로우 진행중: ${i}/999`);
  }
  console.log(`✅ 팔로우 완료`);
  return { tokens };
}

// ── follower: SSE 연결 유지 ───────────────────────────────
export function followerScenario(data) {
  const { tokens }  = data;
  const userIndex   = (__VU - 1) % (tokens.length - 1) + 1;
  const token       = tokens[userIndex];
  const activeVUs   = exec.instance.vusActive;

  const res = http.get(`${BASE}/sse/subscribe`, {
    headers: {
      Authorization: token,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    responseType: 'text',
    timeout: '35s',
    tags: { api: 'sse_subscribe' },
  });

  const connected = check(res, {
    '[Stress] SSE 200':        (r) => r.status === 200,
    '[Stress] connected 수신': (r) => r.body?.includes('connected!'),
  });

  sseConnectSuccess.add(connected);
  sseConnectDuration.add(res.timings.duration);

  if (res.body) {
    const count = (res.body.match(/^data:/gm) || []).length;
    sseEventCount.add(count);
    sseEventPerConn.add(count); // ✅ 연결당 수신 이벤트 수 (공지가 왔는지 확인)
  }

  if (!connected) {
    // ✅ SSE 실패 시점의 VU 수 기록 → Breaking Point 탐지
    sseFailVUs.add(activeVUs);
    console.error(`🚨 SSE 실패 VU:${__VU}, status:${res.status}, activeVUs:${activeVUs}`);
  }
}

// ── seller: 공지 작성 → N명 push ─────────────────────────
export function sellerScenario(data) {
  const { tokens } = data;
  const activeVUs  = exec.instance.vusActive;

  const res = http.post(
    `${BASE}/sellers/${SELLER_ID}/notices`,
    JSON.stringify({
      title:   `k6 stress 공지 ${Date.now()}`,
      content: '스트레스 테스트용 공지입니다.',
    }),
    {
      headers: {
        Authorization: tokens[0],
        'Content-Type': 'application/json',
      },
      tags: { api: 'create_notice' },
    }
  );

  const success = check(res, {
    '[Stress] 공지 작성 201': (r) => r.status === 201,
  });

  const duration = res.timings.duration;

  // ✅ 전체 notify 시간
  notifyDuration.add(duration);
  notifySuccess.add(success);

  // ✅ VU 구간별 분기 기록 → 부하에 따른 지연 상관관계 측정
  if (activeVUs < 500) {
    notifyDurationLow.add(duration);
  } else if (activeVUs < 1000) {
    notifyDurationMid.add(duration);
  } else {
    notifyDurationHigh.add(duration);
  }

  if (!success) {
    // ✅ 공지 실패 시점 VU 수 기록
    notifyFailVUs.add(activeVUs);
  }

  console.log(
    `📢 공지: status=${res.status}, duration=${duration.toFixed(0)}ms, ` +
    `activeVUs=${activeVUs}, ` +
    `구간=${activeVUs < 500 ? 'LOW' : activeVUs < 1000 ? 'MID' : 'HIGH'}`
  );
}

export function handleSummary(data) {
  return generateStressSummary(data, 'notification_03_stress');
}