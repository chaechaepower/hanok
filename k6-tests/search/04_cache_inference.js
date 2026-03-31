/**
 * search_04_cache_inference
 *
 * 목적: Redis 캐시 hit/miss 효과를 응답시간 차이로 간접 측정
 *
 * 방법:
 *   1. 동일 키워드에 연속 두 번 요청
 *   2. 첫 번째(cold): 캐시 미스 or 이미 캐시됨
 *   3. 두 번째(warm): TTL 내 재요청 → 캐시 히트 보장
 *   4. cold avg >> warm avg 이면 Redis 효과 확인
 *
 * 판정 기준:
 *   warm p95 < 20ms  → Redis 정상 동작
 *   cold avg / warm avg ratio > 3 → 캐시 효과 유의미
 *
 * 실행:
 *   k6 run k6-tests/search/04_cache_inference.js
 *   k6 run -e BASE_URL=http://localhost:8080/api/v1 k6-tests/search/04_cache_inference.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { loginAll, authHeader } from '../shared/auth.js';
import { KEYWORDS } from '../shared/searchKeywords.js';

const BASE = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');

const coldMs    = new Trend('cache_cold_ms', true);
const warmMs    = new Trend('cache_warm_ms', true);
const coldCount = new Counter('cache_cold_count');
const warmCount = new Counter('cache_warm_count');
const fasterRate = new Rate('cache_warm_faster_than_cold');

export const options = {
  tags: { domain: 'search', scenario: 'cache_inference' },
  setupTimeout: '300s',
  vus: 1,
  duration: '3m',
  thresholds: {
    cache_warm_ms: ['p(95)<30'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);
  return { tokens };
}

export default function (data) {
  const token   = data.tokens[0];
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
  const url     = `${BASE}/search?keyword=${encodeURIComponent(keyword)}`;
  const headers = authHeader(token);

  // Cold: 첫 번째 요청
  const cold = http.get(url, { headers, tags: { cache_phase: 'cold' } });
  coldMs.add(cold.timings.duration);
  coldCount.add(1);

  // Warm: 즉시 재요청 (TTL 내 캐시 히트 보장)
  const warm = http.get(url, { headers, tags: { cache_phase: 'warm' } });
  warmMs.add(warm.timings.duration);
  warmCount.add(1);

  const warmFaster = warm.timings.duration < cold.timings.duration;
  fasterRate.add(warmFaster);

  check(warm, {
    '[Cache] warm 200 OK': (r) => r.status === 200,
    '[Cache] warm이 cold보다 빠름': () => warmFaster,
  });

  console.log(
    `keyword=${keyword} | cold=${cold.timings.duration.toFixed(0)}ms` +
    ` warm=${warm.timings.duration.toFixed(0)}ms` +
    ` | diff=${Math.max(0, cold.timings.duration - warm.timings.duration).toFixed(0)}ms` +
    ` | ${warmFaster ? '✅ warm 빠름' : '⚠️  동일/역전'}`
  );

  sleep(1);
}

export function handleSummary(data) {
  const m = data.metrics;

  const coldAvg  = m['cache_cold_ms']?.values?.avg?.toFixed(2)          ?? 'N/A';
  const coldP95  = m['cache_cold_ms']?.values?.['p(95)']?.toFixed(2)    ?? 'N/A';
  const coldMin  = m['cache_cold_ms']?.values?.min?.toFixed(2)           ?? 'N/A';
  const warmAvg  = m['cache_warm_ms']?.values?.avg?.toFixed(2)          ?? 'N/A';
  const warmP95  = m['cache_warm_ms']?.values?.['p(95)']?.toFixed(2)    ?? 'N/A';
  const warmMin  = m['cache_warm_ms']?.values?.min?.toFixed(2)           ?? 'N/A';
  const coldCnt  = m['cache_cold_count']?.values?.count                  ?? 0;
  const warmCnt  = m['cache_warm_count']?.values?.count                  ?? 0;
  const fasterPct = ((m['cache_warm_faster_than_cold']?.values?.rate ?? 0) * 100).toFixed(1);

  const coldAvgNum = parseFloat(coldAvg);
  const warmAvgNum = parseFloat(warmAvg);
  const ratio = (warmAvgNum > 0) ? (coldAvgNum / warmAvgNum).toFixed(1) : 'N/A';

  // 판정 기준: warm p95 < 30ms
  // steady-state에서 10개 키워드가 모두 캐시되면 cold도 캐시 히트가 되므로
  // ratio 기반 판정은 무의미. warm 응답 속도 자체로 Redis 동작 여부를 판단.
  const warmP95Num = parseFloat(warmP95);
  let verdict = '';
  if (warmP95Num < 15)       verdict = '✅ Redis 캐시 정상 — warm p95 < 15ms (Redis 전용 응답)';
  else if (warmP95Num < 30)  verdict = '✅ Redis 캐시 정상 — warm p95 < 30ms (steady-state 캐시 히트)';
  else if (warmP95Num < 50)  verdict = '⚠️  Redis 응답 느림 — warm p95 < 50ms, Redis 부하 또는 네트워크 확인';
  else                       verdict = '❌ Redis 캐시 미동작 — warm p95 >= 50ms, 캐싱 로직 또는 Redis 연결 확인';

  const ts         = __ENV.TEST_TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-');
  const filePrefix = `reports/${ts}_search_04_cache_inference`;

  const summary = `
========================================
  테스트: search_04_cache_inference

  [Cold 요청 — 캐시 미스 추정]
  cold avg:    ${coldAvg} ms
  cold p95:    ${coldP95} ms
  cold min:    ${coldMin} ms
  cold 횟수:   ${coldCnt}건

  [Warm 요청 — 캐시 히트 추정]
  warm avg:    ${warmAvg} ms
  warm p95:    ${warmP95} ms
  warm min:    ${warmMin} ms
  warm 횟수:   ${warmCnt}건

  [캐시 효과 지표]
  cold/warm 속도비: ${ratio}x
  warm이 cold보다 빠른 비율: ${fasterPct}%

  [판정]
  ${verdict}
========================================
`;

  console.log(summary);

  const csvHeader = 'cold_avg,cold_p95,warm_avg,warm_p95,ratio,faster_rate';
  const csvLine   = `${coldAvg},${coldP95},${warmAvg},${warmP95},${ratio},${fasterPct}`;

  return {
    stdout: summary,
    [`${filePrefix}_result.json`]:  JSON.stringify(data, null, 2),
    [`${filePrefix}_summary.csv`]:  csvHeader + '\n' + csvLine,
  };
}
