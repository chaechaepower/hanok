import http from 'k6/http';
import { check, sleep } from 'k6';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'notice', scenario: 'smoke' },
  vus: 5,
  duration: '3m',
  thresholds: {
    http_req_failed: ['rate==0'],
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
  check(res, { '[Smoke] Notice GET 200': (r) => r.status === 200 });
  sleep(2);
}

export function handleSummary(data) {
  return generateSummary(data, 'notice_01_smoke');
}