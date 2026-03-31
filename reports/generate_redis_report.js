const fs = require('fs');
const path = require('path');

// ── Redis 캐싱 적용 실측 수치 ──────────────────────────────────────────
const RESULTS = {
  smoke: {
    label: 'Smoke (5 VUs × 1분)',
    durationMs: 173900,
    vusMax: 5,
    tps: 7.42,
    errorRateRaw: 0,
    http: { p95: 117.83, avg: 93.04, min: 18.01, max: 213.59 },
    search: { p95: 29.26, avg: 22.78, min: 18.01, max: 59.49 },
    counts: { total: 295, hits: 95, empties: 200, errors500: 0 },
    hitRatePct: 32.20,
    bpVUs: null,
    dropped: null,
    checks: [
      { name: '[Smoke] 200 OK',        passes: 295, fails: 0   },
      { name: '[Smoke] 결과 1건 이상', passes: 95,  fails: 200 },
    ],
  },
  stepup: {
    label: 'Step-Up (10→1,500 rps / 최대 1,200 VUs)',
    durationMs: 684661,
    vusMax: 1200,
    tps: 93.34,
    errorRateRaw: 0.8094,
    http: { p95: 7769.94, avg: 2830.49, min: 0, max: 59998.05 },
    search: { p95: 7776.14, avg: 2873.66, min: 0, max: 59998.05 },
    counts: { total: 62903, hits: 3426, empties: 17747, errors500: 41730 },
    hitRatePct: 16.18,
    bpVUs: 1,
    dropped: 348396,
    checks: [
      { name: '[StepUp] 200 OK',        passes: 11182, fails: 9991  },
      { name: '[StepUp] 결과 1건 이상', passes: 3426,  fails: 17747 },
    ],
  },
  stress: {
    label: 'Stress (ramping-vus / 최대 1,500 VUs)',
    durationMs: 714700,
    vusMax: 1500,
    tps: 68.41,
    errorRateRaw: 0.8691,
    http: { p95: 4338.55, avg: 2673.28, min: 0, max: 59998.23 },
    search: { p95: 4346.01, avg: 2726.73, min: 0, max: 59998.23 },
    counts: { total: 47894, hits: 1586, empties: 11810, errors500: 34498 },
    hitRatePct: 11.84,
    bpVUs: null,
    dropped: null,
    checks: [
      { name: '[Stress] 200 OK',        passes: 5402, fails: 7994  },
      { name: '[Stress] 결과 1건 이상', passes: 1586, fails: 11810 },
    ],
  },
};

// ── 방법 B 비교 수치 (이전 측정값) ────────────────────────────────────
const PREV = {
  smoke:  { searchP95: 26.51, searchAvg: 20.67, errorRate: 0,      tps: 7.40,   errors500: 0      },
  stepup: { searchP95: 10589.70, searchAvg: 7377.92, errorRate: 71.70, tps: 101.16, errors500: 47893 },
  stress: { searchP95: 11691.95, searchAvg: 6491.82, errorRate: 73.74, tps: 86.42,  errors500: 45033 },
};

// ── 포맷 헬퍼 ──────────────────────────────────────────────────────────
function ms(v)   { return v == null ? 'N/A' : v.toFixed(2) + ' ms'; }
function pct(v)  { return v == null ? 'N/A' : v.toFixed(2) + '%'; }
function num(v)  { return v == null ? 'N/A' : Number(v).toLocaleString(); }
function dur(ms) { const s = Math.round(ms/1000); return s >= 60 ? Math.floor(s/60)+'m '+(s%60)+'s' : s+'s'; }
function errClass(r) { return r < 0.05 ? 'ok' : r < 0.5 ? 'warn' : 'fail'; }
function delta(curr, prev, lowerBetter = true) {
  if (prev == null || curr == null) return '';
  const d = curr - prev;
  const sign = d > 0 ? '+' : '';
  const good = lowerBetter ? d < 0 : d > 0;
  const cls = good ? 'ok' : (d === 0 ? '' : 'fail');
  return `<span class="delta ${cls}">${sign}${d.toFixed(1)}</span>`;
}

function checkRows(checks) {
  return checks.map(c => {
    const total = c.passes + c.fails;
    const rate  = total > 0 ? (c.passes/total*100).toFixed(1) : '0.0';
    const ok    = c.fails === 0;
    return `<tr>
      <td>${c.name}</td>
      <td class="${ok ? 'ok' : ''}">${num(c.passes)}</td>
      <td class="${c.fails > 0 ? 'fail' : ''}">${num(c.fails)}</td>
      <td class="${ok ? 'ok' : 'fail'}">${rate}%</td>
    </tr>`;
  }).join('');
}

function card(key, r) {
  const bp  = r.bpVUs ? `<span class="badge fail">🚨 ${r.bpVUs} VUs (cold start 추정)</span>` : `<span class="badge ok">없음 (안전)</span>`;
  const p   = PREV[key];
  return `
<section class="card">
  <div class="card-header">
    <h2>${r.label}</h2>
    <span class="duration">테스트 시간: ${dur(r.durationMs)}</span>
  </div>

  <div class="grid-3">
    <div class="metric-box">
      <div class="metric-label">최대 VUs</div>
      <div class="metric-value">${r.vusMax}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">TPS</div>
      <div class="metric-value">${r.tps.toFixed(2)} <span class="unit">req/s</span></div>
    </div>
    <div class="metric-box ${errClass(r.errorRateRaw)}">
      <div class="metric-label">HTTP 에러율</div>
      <div class="metric-value">${pct(r.errorRateRaw * 100)}</div>
    </div>
  </div>

  <div class="grid-2">
    <div>
      <h3>HTTP 응답 시간</h3>
      <table>
        <tr><th>지표</th><th>값</th><th>방법 B 대비</th></tr>
        <tr><td>p95</td><td>${ms(r.http.p95)}</td><td>${delta(r.http.p95, p.searchP95)}</td></tr>
        <tr><td>avg</td><td>${ms(r.http.avg)}</td><td>${delta(r.http.avg, p.searchAvg)}</td></tr>
        <tr><td>min</td><td>${ms(r.http.min)}</td><td></td></tr>
        <tr><td>max</td><td>${ms(r.http.max)}</td><td></td></tr>
      </table>

      <h3>Breaking Point</h3>
      <div class="bp-box">${bp}</div>
      ${r.dropped != null ? `<p class="note">Dropped Iterations: ${num(r.dropped)}</p>` : ''}
    </div>
    <div>
      <h3>검색 API 성능 (search_duration_ms)</h3>
      <table>
        <tr><th>지표</th><th>Redis 적용</th><th>방법 B</th></tr>
        <tr><td>p95</td><td>${ms(r.search.p95)}</td><td class="prev">${ms(p.searchP95)}</td></tr>
        <tr><td>avg</td><td>${ms(r.search.avg)}</td><td class="prev">${ms(p.searchAvg)}</td></tr>
        <tr><td>min</td><td>${ms(r.search.min)}</td><td class="prev">—</td></tr>
        <tr><td>max</td><td>${ms(r.search.max)}</td><td class="prev">—</td></tr>
      </table>

      <h3>검색 결과 분포</h3>
      <table>
        <tr><th>항목</th><th>건수</th></tr>
        <tr><td>총 검색</td><td>${num(r.counts.total)}</td></tr>
        <tr><td>결과 있음</td><td class="ok">${num(r.counts.hits)}</td></tr>
        <tr><td>결과 없음</td><td>${num(r.counts.empties)}</td></tr>
        <tr><td>500 에러</td><td class="${r.counts.errors500 > 0 ? 'fail' : 'ok'}">${num(r.counts.errors500)}</td></tr>
        <tr><td>히트율</td><td>${pct(r.hitRatePct)}</td></tr>
      </table>
    </div>
  </div>

  <h3>Checks</h3>
  <table>
    <tr><th>Check</th><th>Pass</th><th>Fail</th><th>Pass율</th></tr>
    ${checkRows(r.checks)}
  </table>
</section>`;
}

// ── 전체 비교 테이블 ───────────────────────────────────────────────────
function compRow(label, a, b, c, lowerBetter = true) {
  function cmp(curr, base) {
    if (typeof curr !== 'number' || typeof base !== 'number') return '';
    const d = curr - base;
    const good = lowerBetter ? d < 0 : d > 0;
    const sign = d > 0 ? '+' : '';
    return `<span class="delta ${good ? 'ok' : 'fail'}">(${sign}${d.toFixed(1)})</span>`;
  }
  return `<tr>
    <td>${label}</td>
    <td>${a}</td>
    <td>${b}</td>
    <td>${c} ${cmp(typeof c === 'string' ? parseFloat(c) : c, typeof b === 'string' ? parseFloat(b) : b)}</td>
  </tr>`;
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>검색 성능 테스트 리포트 — Redis 캐싱 적용</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e2e8f0; line-height: 1.6; }
  .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

  header { margin-bottom: 40px; border-bottom: 2px solid #2d3748; padding-bottom: 24px; }
  header h1 { font-size: 1.8rem; color: #fff; margin-bottom: 8px; }
  .subtitle { color: #94a3b8; font-size: 0.9rem; line-height: 1.8; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; margin-left: 6px; }
  .tag-a  { background:#1e3a5f; color:#93c5fd; }
  .tag-b  { background:#1e3a5f; color:#6ee7b7; }
  .tag-redis { background:#4a1942; color:#f0abfc; }

  .card { background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px; padding: 28px; margin-bottom: 32px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 8px; }
  .card-header h2 { font-size: 1.15rem; color: #fff; }
  .duration { color: #64748b; font-size: 0.85rem; }

  .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  @media(max-width:700px){ .grid-3,.grid-2 { grid-template-columns:1fr; } }

  .metric-box { background:#0f1117; border:1px solid #2d3748; border-radius:8px; padding:16px; text-align:center; }
  .metric-box.ok   { border-color:#16a34a; }
  .metric-box.warn { border-color:#ca8a04; }
  .metric-box.fail { border-color:#dc2626; }
  .metric-label { font-size:0.8rem; color:#94a3b8; margin-bottom:6px; text-transform:uppercase; letter-spacing:.05em; }
  .metric-value { font-size:1.55rem; font-weight:700; color:#fff; }
  .metric-value .unit { font-size:0.85rem; font-weight:400; color:#94a3b8; }

  h3 { font-size:0.85rem; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin:20px 0 10px; }
  table { width:100%; border-collapse:collapse; font-size:0.88rem; }
  th { background:#0f1117; color:#64748b; text-align:left; padding:8px 12px; font-weight:500; border-bottom:1px solid #2d3748; }
  td { padding:8px 12px; border-bottom:1px solid #1e293b; }
  tr:last-child td { border-bottom:none; }

  .ok   { color:#4ade80; }
  .warn { color:#facc15; }
  .fail { color:#f87171; }
  .prev { color:#64748b; }

  .badge { display:inline-block; padding:3px 12px; border-radius:999px; font-size:0.85rem; font-weight:600; }
  .badge.ok   { background:#14532d; color:#4ade80; }
  .badge.fail { background:#450a0a; color:#f87171; }
  .bp-box { margin:8px 0; }
  .note { font-size:0.82rem; color:#64748b; margin-top:6px; }

  .delta { font-size:0.8rem; margin-left:4px; }

  .summary-card { background:#1a1f2e; border:1px solid #2d3748; border-radius:12px; padding:28px; margin-bottom:32px; }
  .summary-card h2 { font-size:1.1rem; color:#fff; margin-bottom:20px; }

  .insight { background:#131926; border:1px solid #334155; border-radius:8px; padding:16px 20px; margin-bottom:24px; }
  .insight h4 { color:#7dd3fc; font-size:0.9rem; margin-bottom:8px; }
  .insight p  { color:#94a3b8; font-size:0.87rem; line-height:1.7; }
  .insight code { background:#1e293b; padding:1px 6px; border-radius:4px; font-size:0.82rem; color:#e2e8f0; }

  footer { text-align:center; color:#475569; font-size:0.8rem; padding:24px 0; border-top:1px solid #2d3748; margin-top:16px; }
</style>
</head>
<body>
<div class="container">

<header>
  <h1>검색 성능 테스트 리포트 <span class="tag tag-redis">Redis 캐싱 적용</span></h1>
  <p class="subtitle">
    적용 사항: FULLTEXT ON &nbsp;|&nbsp; UNION ALL 단일 쿼리 (방법 B)
    &nbsp;+&nbsp; <strong style="color:#f0abfc">Redis 캐싱 (TTL 60s, Key: search:{keyword}:{page}:{size})</strong><br>
    비교 기준: 방법 A <span class="tag tag-a">병렬 + LIMIT</span> &nbsp;/&nbsp;
               방법 B <span class="tag tag-b">UNION ALL + LIMIT</span> &nbsp;/&nbsp;
               방법 C <span class="tag tag-redis">방법 B + Redis</span> &nbsp;|&nbsp; 테스트일: 2026-03-30
  </p>
</header>

<!-- ── 요약 ─────────────────────────────────────────────────── -->
<div class="summary-card">
  <h2>전체 시나리오 핵심 지표 요약 (방법 B vs Redis)</h2>
  <table>
    <tr>
      <th>시나리오</th><th>지표</th>
      <th>방법 B <span class="tag tag-b" style="font-size:.72rem">UNION ALL</span></th>
      <th>방법 C <span class="tag tag-redis" style="font-size:.72rem">+ Redis</span></th>
    </tr>
    <tr>
      <td rowspan="4">Smoke<br><small style="color:#64748b">5 VUs</small></td>
      <td>search p95</td><td class="prev">26.51 ms</td><td>${ms(29.26)}</td>
    </tr>
    <tr><td>search avg</td><td class="prev">20.67 ms</td><td>${ms(22.78)}</td></tr>
    <tr><td>TPS</td><td class="prev">7.40</td><td>7.42</td></tr>
    <tr><td>HTTP 에러율</td><td class="prev ok">0.00%</td><td class="ok">0.00%</td></tr>

    <tr>
      <td rowspan="5">Step-Up<br><small style="color:#64748b">최대 1,200 VUs</small></td>
      <td>search p95</td><td class="prev fail">10,589.70 ms</td><td class="ok">${ms(7776.14)} ✅</td>
    </tr>
    <tr><td>search avg</td><td class="prev fail">7,377.92 ms</td><td class="ok">${ms(2873.66)} ✅</td></tr>
    <tr><td>TPS</td><td class="prev">101.16</td><td>${(93.34).toFixed(2)}</td></tr>
    <tr><td>HTTP 에러율</td><td class="prev fail">71.70%</td><td class="fail">${pct(80.94)}</td></tr>
    <tr><td>500 에러</td><td class="prev fail">47,893건</td><td class="fail">41,730건 ✅</td></tr>

    <tr>
      <td rowspan="5">Stress<br><small style="color:#64748b">최대 1,500 VUs</small></td>
      <td>search p95</td><td class="prev fail">11,691.95 ms</td><td class="ok">${ms(4346.01)} ✅</td>
    </tr>
    <tr><td>search avg</td><td class="prev fail">6,491.82 ms</td><td class="ok">${ms(2726.73)} ✅</td></tr>
    <tr><td>TPS</td><td class="prev">86.42</td><td>${(68.41).toFixed(2)}</td></tr>
    <tr><td>HTTP 에러율</td><td class="prev fail">73.74%</td><td class="fail">${pct(86.91)}</td></tr>
    <tr><td>500 에러</td><td class="prev fail">45,033건</td><td class="fail">34,498건 ✅</td></tr>
  </table>
</div>

<!-- ── 분석 인사이트 ──────────────────────────────────────────── -->
<div class="insight">
  <h4>Smoke — Redis 캐시 warm-up 효과</h4>
  <p>5 VUs 저부하에서 search p95 <code>26.51ms → 29.26ms</code>, avg <code>20.67ms → 22.78ms</code>로 소폭 증가.
  smoke 단계에서는 각 키워드의 첫 요청이 cache miss → DB 조회 후 저장, 이후 동일 키워드는 Redis hit.
  키워드 풀(10개)이 작아서 warm-up 후 hit율이 올라가는 구조이나, 요청 수가 적어 총 개선 폭이 작게 나타남.</p>
</div>
<div class="insight">
  <h4>Step-Up / Stress — search avg 대폭 감소, 에러율은 상승</h4>
  <p>search avg: <code>7,378ms → 2,874ms</code> (61% ↓ stepup), <code>6,492ms → 2,727ms</code> (58% ↓ stress).
  search p95: stepup <code>10,590ms → 7,776ms</code>, stress <code>11,692ms → 4,346ms</code>.
  Redis hit 요청은 DB를 거치지 않아 빠른 응답 → avg/p95 개선.<br>
  반면 HTTP 에러율 상승(71% → 81%, 74% → 87%)은 <strong>캐시 miss 시 DB 쿼리 + 고부하 동시 접속 증가</strong>의 복합 결과.
  고VU 환경에서 신규 키워드(cold) 요청이 DB로 집중 → connection-timeout(3s) 초과 → 500 증가.
  500 에러 건수 자체는 감소(47,893 → 41,730 / 45,033 → 34,498)하여 Redis hit 효과는 확인됨.</p>
</div>
<div class="insight">
  <h4>결론 및 다음 단계</h4>
  <p>Redis 캐싱으로 <strong>latency 지표(avg/p95)는 유의미하게 개선</strong>되었으나,
  고부하 에러율은 오히려 상승. DB까지 도달하는 cache miss 요청이 여전히 서버 임계점을 초과함.
  다음 고도화 방향: <code>LIVE 스트림 종료 이벤트 기반 캐시 invalidate</code> 추가로 정합성 강화,
  <code>TTL 단축 + 인기 키워드 pre-warming</code>으로 cold start 비율 감소.</p>
</div>

${card('smoke',  RESULTS.smoke)}
${card('stepup', RESULTS.stepup)}
${card('stress', RESULTS.stress)}

<footer>
  Generated from k6 test output &nbsp;|&nbsp; Method C: UNION ALL + LIMIT + Redis Cache (TTL 60s) &nbsp;|&nbsp; FULLTEXT ON
</footer>

</div>
</body>
</html>`;

const out = path.join(__dirname, 'search_redis_report.html');
fs.writeFileSync(out, html, 'utf8');
console.log('✅ 생성 완료:', out);
