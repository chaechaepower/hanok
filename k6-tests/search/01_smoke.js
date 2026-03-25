import http from 'k6/http';
import { check, sleep } from 'k6';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'search', scenario: 'smoke' },
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<500'],
  },
  userAgent: 'MyK6Test/Smoke',
};

const KEYWORDS = ['나이키', '한정판', '경매', '자전거', '맥북'];

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

  check(res, { '[Smoke] Search status 200': (r) => r.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'search_01_smoke');
}