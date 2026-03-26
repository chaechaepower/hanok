import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { generateSearchSummary } from '../shared/searchSummary.js';
import { loginAll, authHeader } from '../shared/auth.js';
import { KEYWORDS } from '../shared/searchKeywords.js';

const BASE        = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const FULLTEXT_ON = __ENV.FULLTEXT_ENABLED === 'true';

const searchDuration   = new Trend('search_duration_ms',  true);
const searchHitRate    = new Rate('search_hit_rate');
const searchErrRate    = new Rate('search_error_rate');
const totalCount       = new Counter('search_total_count');
const hitCount         = new Counter('search_hit_count');
const emptyCount       = new Counter('search_empty_count');
const errCount         = new Counter('search_err_count');
const breakingPointVUs = new Trend('breaking_point_vus',   true);

export const options = {
  tags: { domain: 'search', scenario: 'stepup', fulltext: String(FULLTEXT_ON) },
  setupTimeout: '300s',
  scenarios: {
    step_up: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 1200,
      stages: [
        { duration: '5m', target: 50   },
        { duration: '5m', target: 100  },
        { duration: '5m', target: 200  },
        { duration: '5m', target: 300  },
        { duration: '5m', target: 500  },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0    },
      ],
    },
  },
  thresholds: {
    http_req_failed:    [{ threshold: 'rate<0.05', abortOnFail: false }],
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
    `${BASE}/search?keyword=${encodeURIComponent(keyword)}`,
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
    breakingPointVUs.add(exec.instance.vusActive);
    console.error(`🚨 500 에러 (FULLTEXT 없음): VU=${exec.instance.vusActive}`);
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

  if (res.status !== 200) {
    breakingPointVUs.add(exec.instance.vusActive);
  }

  check(res, {
    '[StepUp] 200 OK':        (r) => r.status === 200,
    '[StepUp] 결과 1건 이상': ()  => hit,
  });
}

export function handleSummary(data) {
  return generateSearchSummary(data, 'search_02_stepup');
}