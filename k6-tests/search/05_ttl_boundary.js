/**
 * search_05_ttl_boundary
 *
 * 목적: Redis TTL 만료 전후 동작을 실측으로 검증
 *
 * 흐름:
 *   Phase 1 (warmup)    : 캐시 워밍 (DB 쿼리 발생)
 *   Phase 2 (warm)      : TTL 내 재요청 → 캐시 히트 (빠름)
 *   Phase 3 (sleep)     : TTL + 5s 대기 → 캐시 만료
 *   Phase 4 (miss)      : TTL 만료 후 첫 요청 → 캐시 미스 (느림)
 *   Phase 5 (rehit)     : 즉시 재요청 → 재캐시 히트 (빠름)
 *
 * 판정:
 *   warm avg ≈ rehit avg  → 캐시 히트 성능 일관
 *   miss avg > warm avg   → TTL 만료 동작 정상
 *   rehit avg < miss avg  → 재캐시 성능 복원 정상
 *
 * 환경변수:
 *   CACHE_TTL_SECONDS : 서버 TTL 설정값 (기본 60)
 *   TEST_KEYWORD      : 테스트 키워드 (기본 나이키)
 *
 * 실행:
 *   k6 run k6-tests/search/05_ttl_boundary.js
 *   k6 run -e CACHE_TTL_SECONDS=60 -e TEST_KEYWORD=나이키 k6-tests/search/05_ttl_boundary.js
 *
 * 주의: iteration당 TTL+5초 sleep 포함 → 전체 소요 약 (TTL+5) × iterations 초
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { loginAll, authHeader } from '../shared/auth.js';

const BASE     = (__ENV.BASE_URL           || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const TTL_S    = parseInt(__ENV.CACHE_TTL_SECONDS || '60', 10);
const KEYWORD  = __ENV.TEST_KEYWORD        || '나이키';

const warmMs   = new Trend('ttl_warm_ms',  true);  // TTL 내 재요청 (캐시 히트)
const missMs   = new Trend('ttl_miss_ms',  true);  // TTL 초과 첫 요청 (캐시 미스)
const rehitMs  = new Trend('ttl_rehit_ms', true);  // 만료 후 즉시 재요청 (재캐시 히트)

export const options = {
  tags: { domain: 'search', scenario: 'ttl_boundary' },
  setupTimeout: '300s',
  scenarios: {
    ttl_boundary: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 3,
    },
  },
  thresholds: {
    // warm과 rehit은 캐시 히트 → 빠름
    ttl_warm_ms:  ['avg<50'],
    ttl_rehit_ms: ['avg<50'],
    // miss는 캐시 미스 → warm보다 느려야 정상
    // (절대값보다 상대 비교가 중요하므로 threshold는 느슨하게)
    ttl_miss_ms:  ['avg<5000'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰`);
  console.log(`⏱  TTL 설정값: ${TTL_S}s | 키워드: ${KEYWORD}`);
  return { tokens };
}

export default function (data) {
  const token   = data.tokens[0];
  const url     = `${BASE}/search?keyword=${encodeURIComponent(KEYWORD)}`;
  const headers = authHeader(token);

  // Phase 1: 캐시 워밍
  const warmup = http.get(url, { headers, tags: { ttl_phase: 'warmup' } });
  console.log(`[Phase 1 warmup]  ${warmup.timings.duration.toFixed(0)}ms`);

  // Phase 2: TTL 내 재요청 → 캐시 히트 기대
  const warm = http.get(url, { headers, tags: { ttl_phase: 'warm' } });
  warmMs.add(warm.timings.duration);
  check(warm, { '[TTL] warm 200 OK': (r) => r.status === 200 });
  console.log(`[Phase 2 warm]    ${warm.timings.duration.toFixed(0)}ms  ← 캐시 히트 기대`);

  // Phase 3: TTL + 5s 대기 → 캐시 만료
  console.log(`[Phase 3 sleep]   TTL(${TTL_S}s) + 5s 대기 중...`);
  sleep(TTL_S + 5);

  // Phase 4: TTL 만료 후 첫 요청 → 캐시 미스 기대
  const miss = http.get(url, { headers, tags: { ttl_phase: 'miss' } });
  missMs.add(miss.timings.duration);
  check(miss, { '[TTL] miss 200 OK': (r) => r.status === 200 });
  console.log(`[Phase 4 miss]    ${miss.timings.duration.toFixed(0)}ms  ← 캐시 미스 기대`);

  // Phase 5: 즉시 재요청 → 재캐시 히트 기대
  const rehit = http.get(url, { headers, tags: { ttl_phase: 'rehit' } });
  rehitMs.add(rehit.timings.duration);
  check(rehit, { '[TTL] rehit 200 OK': (r) => r.status === 200 });
  console.log(`[Phase 5 rehit]   ${rehit.timings.duration.toFixed(0)}ms  ← 재캐시 히트 기대`);

  const missSlower  = miss.timings.duration  > warm.timings.duration;
  const rehitFaster = rehit.timings.duration < miss.timings.duration;

  console.log(
    `\n[판정] warm=${warm.timings.duration.toFixed(0)}ms` +
    ` miss=${miss.timings.duration.toFixed(0)}ms` +
    ` rehit=${rehit.timings.duration.toFixed(0)}ms` +
    ` | miss>warm: ${missSlower ? '✅' : '❌'}` +
    ` rehit<miss: ${rehitFaster ? '✅' : '❌'}\n`
  );
}

export function handleSummary(data) {
  const m = data.metrics;

  const warmAvg   = m['ttl_warm_ms']?.values?.avg?.toFixed(2)         ?? 'N/A';
  const warmP95   = m['ttl_warm_ms']?.values?.['p(95)']?.toFixed(2)   ?? 'N/A';
  const missAvg   = m['ttl_miss_ms']?.values?.avg?.toFixed(2)         ?? 'N/A';
  const missP95   = m['ttl_miss_ms']?.values?.['p(95)']?.toFixed(2)   ?? 'N/A';
  const rehitAvg  = m['ttl_rehit_ms']?.values?.avg?.toFixed(2)        ?? 'N/A';
  const rehitP95  = m['ttl_rehit_ms']?.values?.['p(95)']?.toFixed(2)  ?? 'N/A';

  const warmNum  = parseFloat(warmAvg);
  const missNum  = parseFloat(missAvg);
  const rehitNum = parseFloat(rehitAvg);

  const ttlOk    = missNum > warmNum  ? '✅ TTL 만료 후 캐시 미스 동작 정상' : '❌ miss가 warm보다 빠름 — TTL 미만료 or 캐시 무효화 이슈';
  const rehitOk  = rehitNum < missNum ? '✅ 재캐시 후 성능 복원 정상'        : '❌ rehit이 개선되지 않음 — 캐시 저장 실패 의심';

  const ts         = __ENV.TEST_TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-');
  const filePrefix = `reports/${ts}_search_05_ttl_boundary`;

  const summary = `
========================================
  테스트: search_05_ttl_boundary
  키워드: ${KEYWORD} | TTL 설정: ${TTL_S}s

  Phase 2 warm  (캐시 히트):   avg=${warmAvg} ms  p95=${warmP95} ms
  Phase 4 miss  (캐시 미스):   avg=${missAvg} ms  p95=${missP95} ms
  Phase 5 rehit (재캐시 히트): avg=${rehitAvg} ms  p95=${rehitP95} ms

  [판정]
  ${ttlOk}
  ${rehitOk}
========================================
`;

  console.log(summary);

  const csvHeader = 'keyword,ttl_s,warm_avg,warm_p95,miss_avg,miss_p95,rehit_avg,rehit_p95';
  const csvLine   = `${KEYWORD},${TTL_S},${warmAvg},${warmP95},${missAvg},${missP95},${rehitAvg},${rehitP95}`;

  return {
    stdout: summary,
    [`${filePrefix}_result.json`]: JSON.stringify(data, null, 2),
    [`${filePrefix}_summary.csv`]: csvHeader + '\n' + csvLine,
  };
}
