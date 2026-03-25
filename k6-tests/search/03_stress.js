import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';
const BASELINE_VUS = __ENV.BASELINE || 300;

const searchDuration = new Trend('search_duration', true);

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'search', scenario: 'stress' },
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

const KEYWORDS = ['나이키', '한정판', '경매', '자전거', '맥북', '아이폰', '조던'];

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

  check(res, { '[Stress] Search status 200': (r) => r.status === 200 });

  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'search_03_stress');
}