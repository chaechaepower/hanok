import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

const searchDuration = new Trend('search_duration', true);
const errorRate = new Rate('custom_error_rate');

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'search', scenario: 'stepup' },
  scenarios: {
    step_up: {
      executor: 'ramping-arrival-rate',
      // ... (기존 설정 유지) ...
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
    'search_duration': ['p(95)<500'],
  },
};

const KEYWORDS = ['나이키', '한정판', '경매', '자전거', '맥북', '아이폰', '조던', '닌텐도'];

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
  const res = http.get(
    `${BASE}/search?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: authHeader(data.tokens),
      tags: { api: 'search_keyword' } // ✅ API 태그 추가
    }
  );

  searchDuration.add(res.timings.duration, { api: 'search_keyword' }); // ✅
  errorRate.add(res.status !== 200, { api: 'search_keyword' });         // ✅

  check(res, { '[StepUp] Search 200': (r) => r.status === 200 });
}

export function handleSummary(data) {
  return generateSummary(data, 'search_02_stepup');
}