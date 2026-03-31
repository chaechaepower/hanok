import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { generateSearchSummary } from '../shared/searchSummary.js';
import { loginAll, authHeader } from '../shared/auth.js';
import { KEYWORDS } from '../shared/searchKeywords.js';

const BASE           = (__ENV.BASE_URL    || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const FULLTEXT_ON    = __ENV.FULLTEXT_ENABLED === 'true';
const SEARCH_PATH    = (__ENV.SEARCH_PATH || '/search').replace(/\/+$/, '');

const searchDuration = new Trend('search_duration_ms', true);
const searchHitRate  = new Rate('search_hit_rate');
const searchErrRate  = new Rate('search_error_rate');
const totalCount     = new Counter('search_total_count');
const hitCount       = new Counter('search_hit_count');
const emptyCount     = new Counter('search_empty_count');
const errCount       = new Counter('search_err_count');

export const options = {
  tags: { domain: 'search', scenario: 'smoke', fulltext: String(FULLTEXT_ON) },
  setupTimeout: '300s',
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_failed:    ['rate<0.05'],
    search_duration_ms: ['p(95)<500'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);
  console.log(`🔍 FULLTEXT: ${FULLTEXT_ON ? '✅ 적용됨' : '❌ 미적용'}`);
  return { tokens };
}

export default function (data) {
  const userIndex = (__VU - 1) % data.tokens.length;
  const token     = data.tokens[userIndex];
  const keyword   = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

  const res = http.get(
    `${BASE}${SEARCH_PATH}?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: authHeader(token),
      tags: { api: 'search_keyword' },
    }
  );

  searchDuration.add(res.timings.duration);
  totalCount.add(1);

  // ✅ FULLTEXT 없을 때 500 에러 감지
  if (res.status === 500) {
    errCount.add(1);
    searchErrRate.add(true);
    console.error(`🚨 검색 API 500 에러 (FULLTEXT 없음): keyword=${keyword}`);
    return;
  }

  searchErrRate.add(false);


  let resultCount = 0;
  try {
    const body = JSON.parse(res.body);
    resultCount = Array.isArray(body) ? body.length : (body?.data?.length ?? 0);
  } catch (_) {}

  const hit = resultCount > 0;
  searchHitRate.add(hit);
  hit ? hitCount.add(1) : emptyCount.add(1);

  check(res, {
    '[Smoke] 200 OK':        (r) => r.status === 200,
    '[Smoke] 결과 1건 이상': ()  => hit,
  });

  console.log(
    `🔍 [${FULLTEXT_ON ? 'ON' : 'OFF'}] keyword=${keyword}, ` +
    `status=${res.status}, results=${resultCount}, ${res.timings.duration.toFixed(0)}ms`
  );
  console.log(`응답 body: ${res.body.substring(0, 300)}`);

  sleep(1);
}

export function handleSummary(data) {
  const label = SEARCH_PATH === '/search' ? 'search_01_smoke' : `search_01_smoke_${SEARCH_PATH.replace(/\//g, '_').replace(/^_/, '')}`;
  return generateSearchSummary(data, label);
}