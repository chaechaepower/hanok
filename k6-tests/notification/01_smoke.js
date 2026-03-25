import http from 'k6/http';
import { check, sleep } from 'k6';
import { generateSummary } from '../shared/summary.js';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'notification', scenario: 'smoke' },
  vus: 5,
  duration: '1m',
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
  const sse = http.get(`${BASE}/sse/subscribe`, {
    headers: { ...authHeader(data.tokens), 'Accept': 'text/event-stream' },
    timeout: '10s',
    tags: { api: 'sse_subscribe' } // ✅ API 태그 추가
  });
  check(sse, { '[Smoke] SSE Connected (200)': (r) => r.status === 200 });
  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'notification_01_smoke');
}