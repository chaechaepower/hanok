import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function generateSummary(data, testName) {
  const metrics = data.metrics;

  const p95           = metrics['http_req_duration']?.values?.['p(95)']?.toFixed(2) ?? 'N/A';
  const p99           = metrics['http_req_duration']?.values?.['p(99)']?.toFixed(2) ?? 'N/A';
  const avgLatency    = metrics['http_req_duration']?.values?.avg?.toFixed(2) ?? 'N/A';
  const errorRate     = ((metrics['http_req_failed']?.values?.rate ?? 0) * 100).toFixed(2);
  const tps           = metrics['http_reqs']?.values?.rate?.toFixed(2) ?? 'N/A';
  const vus           = metrics['vus_max']?.values?.max ?? 'N/A';

  const wsErrorRate   = ((metrics['ws_errors']?.values?.rate ?? 0) * 100).toFixed(2);
  const wsSessions    = metrics['ws_sessions']?.values?.count ?? 0;

  // ✅ 비즈니스 메트릭
  const chatSuccessRate   = ((metrics['chat_success_rate']?.values?.rate  ?? 0) * 100).toFixed(2);
  const chatSentCount     = metrics['chat_sent_count']?.values?.count     ?? 0;
  const chatReceivedCount = metrics['chat_received_count']?.values?.count ?? 0;
  const stompErrorCount   = metrics['stomp_error_count']?.values?.count   ?? 0;

  // ✅ 한계점(Breaking Point) 추출: 에러가 한 번도 안 났으면 '에러 없음' 처리
  const breakPointTrend = metrics['breaking_point_vus']?.values;
  const breakPointMin   = breakPointTrend?.min ? `${breakPointTrend.min}명` : '에러 없음 (안전함)';
  const csvBreakPoint   = breakPointTrend?.min ?? ''; // CSV용 (숫자만 기록)

  const csvLine = `${testName},${vus},${p95},${p99},${avgLatency},${tps},${errorRate},${wsErrorRate},${chatSentCount},${chatReceivedCount},${chatSuccessRate},${stompErrorCount},${csvBreakPoint}\n`;

  const summary = `
========================================
  테스트: ${testName}

  최대 VUser: ${vus}
  HTTP p95 Latency: ${p95} ms
  HTTP 평균 Latency: ${avgLatency} ms
  HTTP TPS: ${tps} req/s
  HTTP 에러율: ${errorRate}%

  WebSocket 세션 수: ${wsSessions}
  WebSocket 에러율: ${wsErrorRate === 'NaN' ? 0 : wsErrorRate}%

  [비즈니스 채팅 & 부하 한계점]
  채팅 전송 수:        ${chatSentCount}
  채팅 수신 수:        ${chatReceivedCount}
  채팅 비즈니스 성공률: ${chatSuccessRate}%
  STOMP ERROR 횟수:    ${stompErrorCount}
  🚨 최초 에러 발생 구간(Breaking Point): ${breakPointMin}
========================================
`;

  delete data.setup_data;

  const ts = __ENV.TEST_TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-');
  const filePrefix = `reports/${ts}_${testName}`;

  return {
    stdout: summary + '\n' + textSummary(data, { indent: '  ', enableColors: true }),
    [`${filePrefix}_result.json`]: JSON.stringify(data, null, 2),
    [`${filePrefix}_summary.csv`]:
      'test_name,vus_max,p95_ms,p99_ms,avg_ms,tps,error_rate,ws_error_rate,chat_sent,chat_received,chat_success_rate,stomp_error,breaking_point_vus\n' +
      csvLine,
  };
}