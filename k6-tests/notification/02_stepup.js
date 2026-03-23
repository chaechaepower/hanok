import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

const sseDuration = new Trend('sse_subscribe_duration', true);
const errorRate = new Rate('custom_error_rate');

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'notification', scenario: 'stepup' },
  scenarios: {
    step_up: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 500 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true }],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  const sse = http.get(`${BASE}/sse/subscribe`, {
    headers: { ...authHeader(data.tokens), 'Accept': 'text/event-stream' },
    timeout: '30s',
    tags: { api: 'sse_subscribe' } // ✅ API 태그 추가
  });
  sseDuration.add(sse.timings.duration, { api: 'sse_subscribe' }); // ✅
  errorRate.add(sse.status !== 200, { api: 'sse_subscribe' });     // ✅
  check(sse, { '[StepUp] SSE Connected (200)': (r) => r.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'notification_02_stepup');
}