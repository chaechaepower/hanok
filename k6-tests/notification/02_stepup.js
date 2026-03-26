import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const BASE      = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const SELLER_ID = 7;

const sseConnectRate     = new Rate('sse_connect_success');
const sseConnectDuration = new Trend('sse_connect_duration_ms', true);
const notifyDuration     = new Trend('notify_trigger_duration_ms', true);
const notifySuccessRate  = new Rate('notify_trigger_success');
const sseEventCount      = new Counter('sse_event_received');

export const options = {
  tags: { domain: 'notification', scenario: 'stepup' },
  setupTimeout: '300s',
  scenarios: {
    followers: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '5m', target: 50   },
        { duration: '5m', target: 100  },
        { duration: '5m', target: 200  },
        { duration: '5m', target: 500  },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0    },
      ],
      exec: 'followerScenario',
    },
    seller: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '30s',
      duration: '27m',
      preAllocatedVUs: 1,
      maxVUs: 2,
      exec: 'sellerScenario',
    },
  },
  thresholds: {
    http_req_failed:            ['rate<0.05'],
    sse_connect_success:        ['rate>0.95'],
    sse_connect_duration_ms:    ['p(95)<3000'],
    notify_trigger_duration_ms: ['p(95)<5000'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);

  // 1~999번 토큰이 seller 팔로우
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

export function followerScenario(data) {
  const { tokens } = data;
  const userIndex  = (__VU - 1) % (tokens.length - 1) + 1; // tokens[1~999]
  const token      = tokens[userIndex];

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
    '[StepUp] SSE 200':        (r) => r.status === 200,
    '[StepUp] connected 수신': (r) => r.body?.includes('connected!'),
  });

  sseConnectRate.add(connected);
  sseConnectDuration.add(res.timings.duration);

  if (res.body) {
    const eventCount = (res.body.match(/^data:/gm) || []).length;
    sseEventCount.add(eventCount);
  }

  if (!connected) {
    console.error(`🚨 SSE 실패 VU:${__VU}, status:${res.status}, activeVUs:${exec.instance.vusActive}`);
  }

  sleep(1);
}

export function sellerScenario(data) {
  const { tokens } = data;

  const res = http.post(
    `${BASE}/sellers/${SELLER_ID}/notices`,
    JSON.stringify({
      title: `k6 stepup 공지 ${Date.now()}`,
      content: '팔로워 알림 부하 테스트용 공지입니다.',
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
    '[StepUp] 공지 작성 200': (r) => r.status === 201,
  });

  notifyDuration.add(res.timings.duration);
  notifySuccessRate.add(success);

  console.log(`📢 공지: ${res.status}, ${res.timings.duration}ms, activeVUs: ${exec.instance.vusActive}`);
}

export function handleSummary(data) {
  return generateSummary(data, 'notification_02_stepup');
}