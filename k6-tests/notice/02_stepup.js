import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

const getDuration = new Trend('notice_get_duration', true);
const errorRate = new Rate('custom_error_rate');

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'notice', scenario: 'stepup' },
  scenarios: {
    step_up: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 1200,
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
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }],
    'notice_get_duration': ['p(95)<500'],
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
  getDuration.add(res.timings.duration, { api: 'get_notices' }); // ✅ 커스텀 지표 태깅
  errorRate.add(res.status !== 200, { api: 'get_notices' });     // ✅ 커스텀 지표 태깅
  check(res, { '[StepUp] Notice GET 200': (r) => r.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'notice_02_stepup');
}