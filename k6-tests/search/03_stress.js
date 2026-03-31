import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { generateSearchSummary } from '../shared/searchSummary.js';
import { loginAll, authHeader } from '../shared/auth.js';
import { KEYWORDS } from '../shared/searchKeywords.js';

const BASE         = (__ENV.BASE_URL     || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const FULLTEXT_ON  = __ENV.FULLTEXT_ENABLED === 'true';
const BASELINE_VUS = parseInt(__ENV.BASELINE || '1000');
const SEARCH_PATH  = (__ENV.SEARCH_PATH  || '/search').replace(/\/+$/, '');

const searchDuration = new Trend('search_duration_ms',  true);
const searchHitRate  = new Rate('search_hit_rate');
const searchErrRate  = new Rate('search_error_rate');
const totalCount     = new Counter('search_total_count');
const hitCount       = new Counter('search_hit_count');
const emptyCount     = new Counter('search_empty_count');
const errCount       = new Counter('search_err_count');

export const options = {
  tags: { domain: 'search', scenario: 'stress', fulltext: String(FULLTEXT_ON) },
  setupTimeout: '300s',
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: BASELINE_VUS },
        { duration: '3m', target: Math.floor(BASELINE_VUS * 1.5) },
        { duration: '2m',  target: 0  },
        { duration: '2m',  target: 10 },
      ],
    },
  },
  thresholds: {
      http_req_failed:    [{ threshold: 'rate<0.05', abortOnFail: false }],
      search_duration_ms: ['p(95)<3000'],
      search_hit_rate:    ['rate>0.8'],
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

  const res = http.get(
    `${BASE}${SEARCH_PATH}?keyword=${encodeURIComponent(keyword)}`,
    {
      headers: authHeader(token),
      tags: { api: 'search_keyword' },
    }
  );

  searchDuration.add(res.timings.duration);
  totalCount.add(1);

  if (res.status === 500) {
    errCount.add(1);
    searchErrRate.add(true);
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
    '[Stress] 200 OK':        (r) => r.status === 200,
    '[Stress] 결과 1건 이상': ()  => hit,
  });

  sleep(1);
}

export function handleSummary(data) {
  const label = SEARCH_PATH === '/search' ? 'search_03_stress' : `search_03_stress_${SEARCH_PATH.replace(/\//g, '_').replace(/^_/, '')}`;
  return generateSearchSummary(data, label);
}
