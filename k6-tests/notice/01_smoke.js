import http from 'k6/http';
import { check, sleep } from 'k6';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader, TEST_USERS } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

export const options = {
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
  // ✅ Fix 1: sellerId에 매칭되는 단일 토큰 선택 (index = sellerId - 1)
  const sellerId = Math.floor(Math.random() * 5) + 1;
  const token = data.tokens[sellerId - 1];

  // ✅ Fix 2: null 토큰 방어 처리 (로그인 실패 케이스 대비)
  if (!token) {
    console.error(`[Main] sellerId=${sellerId} 토큰 없음, iteration 스킵`);
    return;
  }

  const res = http.get(
    `${BASE}/sellers/${sellerId}/notices`,
    {
      // ✅ Fix 3: authHeader()가 순수 headers 객체를 반환하므로 headers: 키에 정상 할당
      headers: authHeader(token),
      tags: { api: 'get_notices' },
    }
  );

  check(res, { '[Smoke] Notice GET 200': (r) => r.status === 200 });
  sleep(2);
}

export function handleSummary(data) {
  return generateSummary(data, 'notice_01_smoke');
}
