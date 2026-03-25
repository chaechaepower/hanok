import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// =====================================================================
// 공통 인프라 메트릭 추출
// =====================================================================
function extractBaseMetrics(metrics) {
  return {
    p95:         metrics['http_req_duration']?.values?.['p(95)']?.toFixed(2) ?? 'N/A',
    p99:         metrics['http_req_duration']?.values?.['p(99)']?.toFixed(2) ?? 'N/A',
    avgLatency:  metrics['http_req_duration']?.values?.avg?.toFixed(2)        ?? 'N/A',
    errorRate:   ((metrics['http_req_failed']?.values?.rate ?? 0) * 100).toFixed(2),
    tps:         metrics['http_reqs']?.values?.rate?.toFixed(2)               ?? 'N/A',
    vus:         metrics['vus_max']?.values?.max                              ?? 'N/A',
    wsErrorRate: ((metrics['ws_errors']?.values?.rate ?? 0) * 100).toFixed(2),
    wsSessions:  metrics['ws_sessions']?.values?.count                        ?? 0,
  };
}

function extractBreakingPoint(metrics) {
  const trend = metrics['breaking_point_vus']?.values;
  return {
    label: trend?.min ? `${trend.min}명` : '에러 없음 (안전함)',
    value: trend?.min ?? '',
  };
}

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

// =====================================================================
// 채팅 도메인 summary (기존)
// =====================================================================
export function generateSummary(data, testName) {
  const m  = data.metrics;
  const b  = extractBaseMetrics(m);
  const bp = extractBreakingPoint(m);

  const chatSuccessRate   = ((m['chat_success_rate']?.values?.rate  ?? 0) * 100).toFixed(2);
  const chatSentCount     = m['chat_sent_count']?.values?.count     ?? 0;
  const chatReceivedCount = m['chat_received_count']?.values?.count ?? 0;
  const stompErrorCount   = m['stomp_error_count']?.values?.count   ?? 0;

  const summary = `
========================================
  테스트: ${testName}

  최대 VUser: ${b.vus}
  HTTP p95 Latency: ${b.p95} ms
  HTTP 평균 Latency: ${b.avgLatency} ms
  HTTP TPS: ${b.tps} req/s
  HTTP 에러율: ${b.errorRate}%

  WebSocket 세션 수: ${b.wsSessions}
  WebSocket 에러율: ${b.wsErrorRate}%

  [비즈니스 채팅 & 부하 한계점]
  채팅 전송 수:        ${chatSentCount}
  채팅 수신 수:        ${chatReceivedCount}
  채팅 비즈니스 성공률: ${chatSuccessRate}%
  STOMP ERROR 횟수:    ${stompErrorCount}
  🚨 최초 에러 발생 구간(Breaking Point): ${bp.label}
========================================
`;

  const csvHeader = 'test_name,vus_max,p95_ms,p99_ms,avg_ms,tps,error_rate,ws_error_rate,chat_sent,chat_received,chat_success_rate,stomp_error,breaking_point_vus';
  const csvLine   = `${testName},${b.vus},${b.p95},${b.p99},${b.avgLatency},${b.tps},${b.errorRate},${b.wsErrorRate},${chatSentCount},${chatReceivedCount},${chatSuccessRate},${stompErrorCount},${bp.value}`;

  return buildFileOutputs(data, testName, summary, csvHeader, csvLine);
}

// =====================================================================
// 유일가 경매 도메인 summary
// =====================================================================
export function generateUniqueAuctionSummary(data, testName) {
  const m  = data.metrics;
  const b  = extractBaseMetrics(m);
  const bp = extractBreakingPoint(m);

  const bidSent       = m['bid_sent_count']?.values?.count       ?? 0;
  const bidAck        = m['bid_ack_count']?.values?.count        ?? 0;
  const statsReceived = m['stats_received_count']?.values?.count ?? 0;
  const stompErrors   = m['stomp_error_count']?.values?.count    ?? 0;
  const alreadyBid    = m['already_bid_count']?.values?.count    ?? 0;
  const bidSuccess    = ((m['bid_success_rate']?.values?.rate ?? 0) * 100).toFixed(2);

  // 구간별 Latency
  const p95WsConnect  = m['latency_ws_connect_ms']?.values?.['p(95)']?.toFixed(0)    ?? 'N/A';
  const p95StompConn  = m['latency_stomp_connect_ms']?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  const avgBidToAck   = m['latency_bid_to_ack_ms']?.values?.avg?.toFixed(0)          ?? 'N/A';
  const p95BidToAck   = m['latency_bid_to_ack_ms']?.values?.['p(95)']?.toFixed(0)    ?? 'N/A';
  const p95BidToStats = m['latency_bid_to_stats_ms']?.values?.['p(95)']?.toFixed(0)  ?? 'N/A';
  const p95E2E        = m['latency_e2e_ms']?.values?.['p(95)']?.toFixed(0)           ?? 'N/A';

  const summary = `
========================================
  테스트: ${testName}

  최대 VUser:          ${b.vus}
  HTTP p95 Latency:    ${b.p95} ms
  HTTP 평균 Latency:   ${b.avgLatency} ms
  HTTP TPS:            ${b.tps} req/s
  HTTP 에러율:         ${b.errorRate}%

  WebSocket 세션 수:   ${b.wsSessions}
  WebSocket 에러율:    ${b.wsErrorRate}%

  [구간별 Latency p95]
  ① WS 연결:           ${p95WsConnect} ms
  ② STOMP 연결:        ${p95StompConn} ms
  ④ 입찰→ACK (avg):    ${avgBidToAck} ms
  ④ 입찰→ACK (p95):    ${p95BidToAck} ms
  ⑥ 입찰→STATS (p95):  ${p95BidToStats} ms
  E2E 전체 (p95):       ${p95E2E} ms

  [유일가 경매 입찰 결과]
  입찰 발송 수:         ${bidSent}
  ACK 수신 수:          ${bidAck}
  STATS 수신 수:        ${statsReceived}
  중복 입찰 횟수:       ${alreadyBid}
  비즈니스 성공률:      ${bidSuccess}%
  STOMP ERROR 횟수:     ${stompErrors}
  🚨 최초 에러 발생 구간(Breaking Point): ${bp.label}
========================================
`;

  const csvHeader = 'test_name,vus_max,p95_ms,p99_ms,avg_ms,tps,error_rate,ws_error_rate,ws_connect_p95,stomp_connect_p95,bid_to_ack_avg,bid_to_ack_p95,bid_to_stats_p95,e2e_p95,bid_sent,bid_ack,stats_received,already_bid,bid_success_rate,stomp_error,breaking_point_vus';
  const csvLine   = `${testName},${b.vus},${b.p95},${b.p99},${b.avgLatency},${b.tps},${b.errorRate},${b.wsErrorRate},${p95WsConnect},${p95StompConn},${avgBidToAck},${p95BidToAck},${p95BidToStats},${p95E2E},${bidSent},${bidAck},${statsReceived},${alreadyBid},${bidSuccess},${stompErrors},${bp.value}`;

  return buildFileOutputs(data, testName, summary, csvHeader, csvLine);
}