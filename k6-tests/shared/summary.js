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

export function generateStressSummary(data, testName) {
  const m  = data.metrics;
  const b  = extractBaseMetrics(m);

  // SSE 구독
  const sseSuccess      = ((m['sse_connect_success']?.values?.rate  ?? 0) * 100).toFixed(2);
  const sseConnP95      = m['sse_connect_duration_ms']?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  const sseEventTotal   = m['sse_event_received']?.values?.count    ?? 0;
  const sseEventPerConn = m['sse_event_per_connection']?.values?.avg?.toFixed(2) ?? 'N/A';
  const sseFailVUs      = m['sse_fail_vus']?.values?.min            ?? null;

  // 공지 push
  const notifySuccess   = ((m['notify_trigger_success']?.values?.rate ?? 0) * 100).toFixed(2);
  const notifyAvg       = m['notify_trigger_duration_ms']?.values?.avg?.toFixed(0)      ?? 'N/A';
  const notifyP95       = m['notify_trigger_duration_ms']?.values?.['p(95)']?.toFixed(0) ?? 'N/A';
  const notifyMax       = m['notify_trigger_duration_ms']?.values?.max?.toFixed(0)       ?? 'N/A';
  const notifyFailVUs   = m['notify_fail_vus']?.values?.min         ?? null;

  // VU 구간별 notify
  const notifyLowP95    = m['notify_duration_low_vus']?.values?.['p(95)']?.toFixed(0)  ?? 'N/A';
  const notifyMidP95    = m['notify_duration_mid_vus']?.values?.['p(95)']?.toFixed(0)  ?? 'N/A';
  const notifyHighP95   = m['notify_duration_high_vus']?.values?.['p(95)']?.toFixed(0) ?? 'N/A';

  // Breaking Point
  const sseBreaking    = sseFailVUs    ? `🚨 ${sseFailVUs}명`    : '없음 (안전)';
  const notifyBreaking = notifyFailVUs ? `🚨 ${notifyFailVUs}명` : '없음 (안전)';

  const summary = `
========================================
  테스트: ${testName}

  최대 VUser:          ${b.vus}
  HTTP p95 Latency:    ${b.p95} ms
  HTTP 평균 Latency:   ${b.avgLatency} ms
  HTTP TPS:            ${b.tps} req/s
  HTTP 에러율:         ${b.errorRate}%

  [SSE 구독 결과]
  연결 성공률:         ${sseSuccess}%
  연결 시간 p95:       ${sseConnP95} ms
  총 이벤트 수신:      ${sseEventTotal}개
  연결당 평균 이벤트:  ${sseEventPerConn}개
  🚨 SSE Breaking Point: ${sseBreaking}

  [공지 Push 결과]
  공지 성공률:         ${notifySuccess}%
  Push 시간 avg:       ${notifyAvg} ms
  Push 시간 p95:       ${notifyP95} ms
  Push 시간 max:       ${notifyMax} ms
  🚨 공지 Breaking Point: ${notifyBreaking}

  [VU 구간별 Push 지연 — 병목 위치 분석]
  LOW  (VU < 500):     p95 = ${notifyLowP95} ms
  MID  (VU 500~999):   p95 = ${notifyMidP95} ms
  HIGH (VU >= 1000):   p95 = ${notifyHighP95} ms

  판단 기준:
  LOW~MID 급증 → followRepository.findBySeller() DB 쿼리 병목
  MID~HIGH 급증 → sseEmitter.send() × N 반복 병목
  전 구간 높음  → SseEmitter 자체 구조 한계 (Spring MVC 동기)
========================================
`;

  const csvHeader = 'test_name,vus_max,p95_ms,avg_ms,tps,error_rate,' +
    'sse_success,sse_conn_p95,sse_event_total,sse_event_per_conn,sse_breaking,' +
    'notify_success,notify_avg,notify_p95,notify_max,notify_breaking,' +
    'notify_low_p95,notify_mid_p95,notify_high_p95';
  const csvLine = `${testName},${b.vus},${b.p95},${b.avgLatency},${b.tps},${b.errorRate},` +
    `${sseSuccess},${sseConnP95},${sseEventTotal},${sseEventPerConn},${sseFailVUs ?? ''},` +
    `${notifySuccess},${notifyAvg},${notifyP95},${notifyMax},${notifyFailVUs ?? ''},` +
    `${notifyLowP95},${notifyMidP95},${notifyHighP95}`;

  return buildFileOutputs(data, testName, summary, csvHeader, csvLine);
}
