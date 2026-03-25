import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';
const BASELINE_VUS = __ENV.BASELINE || 300;

const stressLatency = new Trend('stress_latency');

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'notification', scenario: 'stress' },
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: BASELINE_VUS },
        { duration: '10m', target: Math.floor(BASELINE_VUS * 1.5) },
        { duration: '5m', target: 0 },
        { duration: '5m', target: 10 },
      ],
    },
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
  stressLatency.add(sse.timings.duration, { api: 'sse_subscribe' }); // ✅
  check(sse, { '[Stress] SSE Connected (200)': (r) => r.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'notification_03_stress');
}