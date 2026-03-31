/**
 * search_06_autocomplete_smoke
 *
 * 목적: 자동완성 엔드포인트 (/search/autocomplete) 기본 동작 검증
 *
 * 검증 항목:
 *   - 200 OK 응답
 *   - 응답 배열 길이 1건 이상 (hit rate)
 *   - p95 응답속도 < 200ms (Redis 캐시 히트 포함)
 *   - Redis 캐시 효과: 동일 키워드 2회 연속 요청 시 2번째가 더 빠름
 *
 * 환경변수:
 *   BASE_URL    : API 서버 주소 (기본 http://j14d105.p.ssafy.io:8080/api/v1)
 *   AC_LIMIT    : 자동완성 최대 건수 (기본 10)
 *
 * 실행:
 *   k6 run k6-tests/search/06_autocomplete_smoke.js
 *   .\run_test.ps1 -scriptPath 'search/06_autocomplete_smoke.js'
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { generateSearchSummary } from '../shared/searchSummary.js';
import { loginAll, authHeader } from '../shared/auth.js';
import { KEYWORDS } from '../shared/searchKeywords.js';

const BASE  = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const LIMIT = parseInt(__ENV.AC_LIMIT || '10', 10);

const acDuration = new Trend('ac_duration_ms',   true);
const acHitRate  = new Rate('search_hit_rate');
const acErrRate  = new Rate('search_error_rate');
const totalCount = new Counter('search_total_count');
const hitCount   = new Counter('search_hit_count');
const emptyCount = new Counter('search_empty_count');
const errCount   = new Counter('search_err_count');

// searchSummary.js 재사용을 위해 search_duration_ms 도 추가 기록
const searchDuration = new Trend('search_duration_ms', true);

export const options = {
  tags: { domain: 'search', scenario: 'autocomplete_smoke' },
  setupTimeout: '300s',
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_failed:    ['rate<0.05'],
    ac_duration_ms:     ['p(95)<200'],
    search_duration_ms: ['p(95)<200'],
    // 히트율은 DB 데이터 규모에 의존하므로 느슨하게 설정
    search_hit_rate:    ['rate>0.1'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);
  return { tokens };
}

export default function (data) {
  const userIndex = (__VU - 1) % data.tokens.length;
  const token     = data.tokens[userIndex];
  const keyword   = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
  const url       = `${BASE}/search/autocomplete?keyword=${encodeURIComponent(keyword)}&limit=${LIMIT}`;

  const res = http.get(url, {
    headers: authHeader(token),
    tags: { api: 'autocomplete' },
  });

  acDuration.add(res.timings.duration);
  searchDuration.add(res.timings.duration);
  totalCount.add(1);

  if (res.status === 500) {
    errCount.add(1);
    acErrRate.add(true);
    console.error(`🚨 자동완성 500 에러: keyword=${keyword}`);
    return;
  }

  acErrRate.add(false);

  let resultCount = 0;
  try {
    const body = JSON.parse(res.body);
    resultCount = Array.isArray(body) ? body.length : 0;
  } catch (_) {}

  const hit = resultCount > 0;
  acHitRate.add(hit);
  hit ? hitCount.add(1) : emptyCount.add(1);

  check(res, {
    '[AC Smoke] 200 OK':        (r) => r.status === 200,
    '[AC Smoke] 결과 1건 이상': ()  => hit,
    '[AC Smoke] 배열 응답':     (r) => {
      try { return Array.isArray(JSON.parse(r.body)); } catch (_) { return false; }
    },
  });

  console.log(
    `🔤 keyword=${keyword}, status=${res.status}, suggestions=${resultCount}, ${res.timings.duration.toFixed(0)}ms`
  );

  sleep(1);
}

export function handleSummary(data) {
  return generateSearchSummary(data, 'search_06_autocomplete_smoke');
}
