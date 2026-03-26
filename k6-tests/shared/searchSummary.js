import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

function buildFileOutputs(data, testName, summaryText, csvHeader, csvLine) {
  delete data.setup_data;
  const ts         = __ENV.TEST_TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-');
  const filePrefix = `reports/${ts}_${testName}`;
  return {
    stdout: summaryText + '\n' + textSummary(data, { indent: '  ', enableColors: true }),
    [`${filePrefix}_result.json`]: JSON.stringify(data, null, 2),
    [`${filePrefix}_summary.csv`]: csvHeader + '\n' + csvLine,
  };
}

export function generateSearchSummary(data, testName) {
  const m = data.metrics;

  const vus        = m['vus_max']?.values?.max                               ?? 'N/A';
  const p95        = m['http_req_duration']?.values?.['p(95)']?.toFixed(2)   ?? 'N/A';
  const avgLatency = m['http_req_duration']?.values?.avg?.toFixed(2)          ?? 'N/A';
  const tps        = m['http_reqs']?.values?.rate?.toFixed(2)                 ?? 'N/A';
  const errorRate  = ((m['http_req_failed']?.values?.rate ?? 0) * 100).toFixed(2);

  const searchP95  = m['search_duration_ms']?.values?.['p(95)']?.toFixed(2)  ?? 'N/A';
  const searchAvg  = m['search_duration_ms']?.values?.avg?.toFixed(2)         ?? 'N/A';
  const searchMin  = m['search_duration_ms']?.values?.min?.toFixed(2)         ?? 'N/A';
  const searchMax  = m['search_duration_ms']?.values?.max?.toFixed(2)         ?? 'N/A';
  const hitRate    = ((m['search_hit_rate']?.values?.rate   ?? 0) * 100).toFixed(2);
  const errRate    = ((m['search_error_rate']?.values?.rate ?? 0) * 100).toFixed(2);
  const totalReqs  = m['search_total_count']?.values?.count  ?? 0;
  const hits       = m['search_hit_count']?.values?.count    ?? 0;
  const empties    = m['search_empty_count']?.values?.count  ?? 0;
  const errs       = m['search_err_count']?.values?.count    ?? 0;

  const bp      = m['breaking_point_vus']?.values;
  const bpLabel = bp?.min ? `🚨 ${bp.min}명` : '없음 (안전)';

  const fulltextLabel = __ENV.FULLTEXT_ENABLED === 'true' ? '✅ 적용됨' : '❌ 미적용';

  const summary = `
========================================
  테스트: ${testName}
  FULLTEXT: ${fulltextLabel}

  최대 VUser:          ${vus}
  HTTP p95 Latency:    ${p95} ms
  HTTP 평균 Latency:   ${avgLatency} ms
  HTTP TPS:            ${tps} req/s
  HTTP 에러율:         ${errorRate}%

  [검색 성능]
  검색 p95:            ${searchP95} ms
  검색 avg:            ${searchAvg} ms
  검색 min:            ${searchMin} ms
  검색 max:            ${searchMax} ms

  [검색 결과]
  총 검색 수:          ${totalReqs}건
  결과 있음:           ${hits}건
  결과 없음:           ${empties}건
  500 에러:            ${errs}건
  히트율:              ${hitRate}%
  에러율:              ${errRate}%

  🚨 Breaking Point: ${bpLabel}
========================================
`;

  const csvHeader = 'test_name,fulltext,vus_max,p95_ms,avg_ms,tps,error_rate,' +
    'search_p95,search_avg,search_min,search_max,' +
    'hit_rate,err_rate,total,hits,empties,errs,breaking_point';
  const csvLine = `${testName},${__ENV.FULLTEXT_ENABLED ?? 'unknown'},` +
    `${vus},${p95},${avgLatency},${tps},${errorRate},` +
    `${searchP95},${searchAvg},${searchMin},${searchMax},` +
    `${hitRate},${errRate},${totalReqs},${hits},${empties},${errs},${bp?.min ?? ''}`;

  return buildFileOutputs(data, testName, summary, csvHeader, csvLine);
}