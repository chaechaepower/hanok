import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';
const BASELINE_VUS = __ENV.BASELINE || 300;

const stressLatency = new Trend('stress_latency', true);

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'notice', scenario: 'stress' },
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
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  const sellerId = Math.floor(Math.random() * 5) + 1;
  const res = http.get(
    `${BASE}/sellers/${sellerId}/notices`,
    {
      headers: authHeader(data.tokens),
      tags: { api: 'get_notices' } // ✅ API 태그 추가
    }
  );
  stressLatency.add(res.timings.duration, { api: 'get_notices' }); // ✅
  check(res, { '[Stress] Notice GET 200': (r) => r.status === 200 });
  sleep(2);
}

export function handleSummary(data) {
  return generateSummary(data, 'notice_03_stress');
}