const fs = require('fs');
const path = require('path');

const FILES = {
  smoke:  '2026-03-30T07-18-44-968Z_search_01_smoke_result.json',
  stepup: '2026-03-30T07-30-56-797Z_search_02_stepup_result.json',
  stress: '2026-03-30T07-53-47-505Z_search_03_stress_result.json',
};

const LABELS = {
  smoke:  'Smoke (5 VUs × 1분)',
  stepup: 'Step-Up (10→1,500 rps / 최대 1,200 VUs)',
  stress: 'Stress (ramping-vus / 최대 1,500 VUs)',
};

const dir = __dirname;
const data = {};
for (const [key, file] of Object.entries(FILES)) {
  data[key] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
}

function m(d, name) { return d.metrics[name]; }
function val(d, name, key) { return m(d, name)?.values?.[key] ?? null; }
function ms(v) { return v == null ? 'N/A' : v.toFixed(2) + ' ms'; }
function pct(v) { return v == null ? 'N/A' : (v * 100).toFixed(2) + '%'; }
function num(v) { return v == null ? 'N/A' : Number(v).toLocaleString(); }

function extract(d) {
  const dur = d.state.testRunDurationMs / 1000;
  return {
    duration:    dur.toFixed(0) + 's',
    vusMax:      val(d, 'vus_max', 'max') ?? val(d, 'vus', 'max') ?? 'N/A',
    httpP95:     ms(val(d, 'http_req_duration', 'p(95)')),
    httpAvg:     ms(val(d, 'http_req_duration', 'avg')),
    httpMin:     ms(val(d, 'http_req_duration', 'min')),
    tps:         (val(d, 'http_reqs', 'rate') ?? 0).toFixed(2),
    errorRate:   pct(val(d, 'http_req_failed', 'rate')),
    errorRateRaw: val(d, 'http_req_failed', 'rate') ?? 0,
    searchP95:   ms(val(d, 'search_duration_ms', 'p(95)')),
    searchAvg:   ms(val(d, 'search_duration_ms', 'avg')),
    searchMin:   ms(val(d, 'search_duration_ms', 'min')),
    searchMax:   ms(val(d, 'search_duration_ms', 'max')),
    hitRate:     pct(val(d, 'search_hit_rate', 'rate')),
    errRate:     pct(val(d, 'search_error_rate', 'rate')),
    total:       num(val(d, 'search_total_count', 'count')),
    hits:        num(val(d, 'search_hit_count', 'count')),
    empties:     num(val(d, 'search_empty_count', 'count')),
    errors500:   num(val(d, 'search_err_count', 'count')),
    bpMin:       m(d, 'breaking_point_vus')?.values?.min,
    checks:      d.root_group?.checks ?? [],
    dropped:     val(d, 'dropped_iterations', 'count'),
  };
}

const e = { smoke: extract(data.smoke), stepup: extract(data.stepup), stress: extract(data.stress) };

function badge(ok, trueText, falseText) {
  return ok
    ? `<span class="badge ok">${trueText}</span>`
    : `<span class="badge fail">${falseText}</span>`;
}

function errClass(rate) {
  if (rate < 0.05) return 'ok';
  if (rate < 0.3)  return 'warn';
  return 'fail';
}

function checkRows(checks) {
  return checks.map(c => {
    const total = c.passes + c.fails;
    const rate  = total > 0 ? (c.passes / total * 100).toFixed(1) : '0.0';
    const ok    = c.fails === 0;
    return `<tr>
      <td>${c.name}</td>
      <td class="${ok ? 'ok' : 'fail'}">${c.passes.toLocaleString()}</td>
      <td class="${ok ? '' : 'fail'}">${c.fails.toLocaleString()}</td>
      <td class="${ok ? 'ok' : 'fail'}">${rate}%</td>
    </tr>`;
  }).join('');
}

function scenarioCard(key, ex) {
  const bp = ex.bpMin ? `<span class="badge fail">🚨 ${ex.bpMin} VUs</span>` : `<span class="badge ok">없음 (안전)</span>`;
  const dropped = ex.dropped ? `<tr><td>Dropped Iterations</td><td class="warn">${num(ex.dropped)}</td></tr>` : '';
  return `
<section class="card">
  <div class="card-header">
    <h2>${LABELS[key]}</h2>
    <span class="duration">테스트 시간: ${ex.duration}</span>
  </div>

  <div class="grid-3">
    <div class="metric-box">
      <div class="metric-label">최대 VUs</div>
      <div class="metric-value">${ex.vusMax}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">TPS</div>
      <div class="metric-value">${ex.tps} <span class="unit">req/s</span></div>
    </div>
    <div class="metric-box ${errClass(ex.errorRateRaw)}">
      <div class="metric-label">HTTP 에러율</div>
      <div class="metric-value">${ex.errorRate}</div>
    </div>
  </div>

  <div class="grid-2">
    <div>
      <h3>HTTP 응답 시간</h3>
      <table>
        <tr><th>지표</th><th>값</th></tr>
        <tr><td>p95</td><td>${ex.httpP95}</td></tr>
        <tr><td>avg</td><td>${ex.httpAvg}</td></tr>
        <tr><td>min</td><td>${ex.httpMin}</td></tr>
      </table>

      <h3>Breaking Point</h3>
      <div class="bp-box">${bp}</div>
      ${ex.dropped != null ? `<p class="note">Dropped Iterations: ${num(ex.dropped)}</p>` : ''}
    </div>
    <div>
      <h3>검색 API 성능 (search_duration_ms)</h3>
      <table>
        <tr><th>지표</th><th>값</th></tr>
        <tr><td>p95</td><td>${ex.searchP95}</td></tr>
        <tr><td>avg</td><td>${ex.searchAvg}</td></tr>
        <tr><td>min</td><td>${ex.searchMin}</td></tr>
        <tr><td>max</td><td>${ex.searchMax}</td></tr>
      </table>

      <h3>검색 결과 분포</h3>
      <table>
        <tr><th>항목</th><th>건수</th></tr>
        <tr><td>총 검색</td><td>${ex.total}</td></tr>
        <tr><td>결과 있음</td><td class="ok">${ex.hits}</td></tr>
        <tr><td>결과 없음</td><td>${ex.empties}</td></tr>
        <tr><td>500 에러</td><td class="${ex.errors500 !== '0' ? 'fail' : 'ok'}">${ex.errors500}</td></tr>
        <tr><td>히트율</td><td>${ex.hitRate}</td></tr>
      </table>
    </div>
  </div>

  <h3>Checks</h3>
  <table>
    <tr><th>Check</th><th>Pass</th><th>Fail</th><th>Pass율</th></tr>
    ${checkRows(ex.checks)}
  </table>
</section>`;
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>검색 성능 테스트 리포트 — 방법 B (UNION ALL + LIMIT)</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f1117; color: #e2e8f0; line-height: 1.6; }
  .container { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }

  header { margin-bottom: 40px; border-bottom: 2px solid #2d3748; padding-bottom: 24px; }
  header h1 { font-size: 1.8rem; color: #fff; margin-bottom: 8px; }
  header .subtitle { color: #94a3b8; font-size: 0.95rem; }
  .tag { display: inline-block; background: #1e40af; color: #bfdbfe; padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; margin-left: 8px; }

  .card { background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px; padding: 28px; margin-bottom: 32px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 8px; }
  .card-header h2 { font-size: 1.2rem; color: #fff; }
  .duration { color: #64748b; font-size: 0.85rem; }

  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  @media (max-width: 700px) { .grid-3 { grid-template-columns: 1fr; } .grid-2 { grid-template-columns: 1fr; } }

  .metric-box { background: #0f1117; border: 1px solid #2d3748; border-radius: 8px; padding: 16px; text-align: center; }
  .metric-box.ok { border-color: #16a34a; }
  .metric-box.warn { border-color: #ca8a04; }
  .metric-box.fail { border-color: #dc2626; }
  .metric-label { font-size: 0.8rem; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .metric-value { font-size: 1.6rem; font-weight: 700; color: #fff; }
  .metric-value .unit { font-size: 0.9rem; font-weight: 400; color: #94a3b8; }

  h3 { font-size: 0.95rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { background: #0f1117; color: #64748b; text-align: left; padding: 8px 12px; font-weight: 500; border-bottom: 1px solid #2d3748; }
  td { padding: 8px 12px; border-bottom: 1px solid #1e293b; }
  tr:last-child td { border-bottom: none; }

  .ok { color: #4ade80; }
  .warn { color: #facc15; }
  .fail { color: #f87171; }

  .badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
  .badge.ok { background: #14532d; color: #4ade80; }
  .badge.fail { background: #450a0a; color: #f87171; }
  .bp-box { margin: 8px 0; }
  .note { font-size: 0.82rem; color: #64748b; margin-top: 6px; }

  .summary-section { background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px; padding: 28px; margin-bottom: 32px; }
  .summary-section h2 { font-size: 1.1rem; color: #fff; margin-bottom: 20px; }
  .summary-table th { background: #0f1117; }
  .summary-table td:first-child { color: #94a3b8; }

  footer { text-align: center; color: #475569; font-size: 0.8rem; padding: 24px 0; border-top: 1px solid #2d3748; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">

<header>
  <h1>검색 성능 테스트 리포트 <span class="tag">방법 B</span></h1>
  <p class="subtitle">
    적용 사항: FULLTEXT ON &nbsp;|&nbsp; UNION ALL 단일 쿼리 &nbsp;|&nbsp; LIMIT 페이지네이션 (page=0, size=20)
    &nbsp;|&nbsp; 테스트일: 2026-03-30
  </p>
</header>

<div class="summary-section">
  <h2>시나리오별 핵심 지표 요약</h2>
  <table class="summary-table">
    <tr>
      <th>시나리오</th>
      <th>최대 VUs</th>
      <th>search p95</th>
      <th>search avg</th>
      <th>TPS</th>
      <th>HTTP 에러율</th>
      <th>500 에러</th>
      <th>Breaking Point</th>
    </tr>
    <tr>
      <td>Smoke</td>
      <td>${e.smoke.vusMax}</td>
      <td class="ok">${e.smoke.searchP95}</td>
      <td class="ok">${e.smoke.searchAvg}</td>
      <td>${e.smoke.tps}</td>
      <td class="ok">${e.smoke.errorRate}</td>
      <td class="ok">${e.smoke.errors500}</td>
      <td class="ok">없음</td>
    </tr>
    <tr>
      <td>Step-Up</td>
      <td>${e.stepup.vusMax}</td>
      <td class="fail">${e.stepup.searchP95}</td>
      <td class="fail">${e.stepup.searchAvg}</td>
      <td>${e.stepup.tps}</td>
      <td class="fail">${e.stepup.errorRate}</td>
      <td class="fail">${e.stepup.errors500}</td>
      <td class="fail">🚨 ${e.stepup.bpMin ?? '-'} VUs</td>
    </tr>
    <tr>
      <td>Stress</td>
      <td>${e.stress.vusMax}</td>
      <td class="fail">${e.stress.searchP95}</td>
      <td class="fail">${e.stress.searchAvg}</td>
      <td>${e.stress.tps}</td>
      <td class="fail">${e.stress.errorRate}</td>
      <td class="fail">${e.stress.errors500}</td>
      <td>${e.stress.bpMin ? `🚨 ${e.stress.bpMin}` : '없음'}</td>
    </tr>
  </table>
</div>

${scenarioCard('smoke', e.smoke)}
${scenarioCard('stepup', e.stepup)}
${scenarioCard('stress', e.stress)}

<footer>
  Generated from k6 handleSummary JSON &nbsp;|&nbsp; Method B: UNION ALL + LIMIT Pagination &nbsp;|&nbsp; FULLTEXT ON
</footer>

</div>
</body>
</html>`;

const outFile = path.join(dir, 'search_method_b_report.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log('✅ 생성 완료:', outFile);
