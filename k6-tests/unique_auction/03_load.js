import ws from 'k6/ws';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';
import { generateUniqueAuctionSummary } from '../shared/summary.js';

const HTTP_BASE  = (__ENV.BASE_URL    || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const WS_BASE    = (__ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws-connect').replace(/\/+$/, '');
const STREAM_ID  = 61;
const AUCTION_ID = 70;
const BID_MIN    = 10000;
const BID_MAX    = 100000;

// 기존 메트릭
const wsErrors           = new Rate('ws_errors');
const bidSuccessRate     = new Rate('bid_success_rate');
const bidSentCount       = new Counter('bid_sent_count');
const bidAckCount        = new Counter('bid_ack_count');
const statsReceivedCount = new Counter('stats_received_count');
const stompErrorCount    = new Counter('stomp_error_count');

// ✅ 구간별 Latency Trend
const latencyWsConnect     = new Trend('latency_ws_connect_ms',   true); // ① WS 연결 완료까지
const latencyStompConnect  = new Trend('latency_stomp_connect_ms',true); // ② STOMP CONNECTED까지
const latencyBidToAck      = new Trend('latency_bid_to_ack_ms',   true); // ④→⑤ 입찰 발송 → ACK
const latencyBidToStats    = new Trend('latency_bid_to_stats_ms', true); // ④→⑥ 입찰 발송 → STATS
const latencyE2E           = new Trend('latency_e2e_ms',          true); // 전체 WS연결 → 성공까지

export const options = {
  setupTimeout: '300s',
  tags: { domain: 'unique_auction', scenario: 'load' },
  scenarios: {
    load: {
      executor: 'shared-iterations',
      vus: 1000,
      iterations: 1000,
      maxDuration: '3m',
    },
  },
  thresholds: {
    ws_errors:              ['rate==0'],
    bid_success_rate:       ['rate==1.0'],
    latency_bid_to_ack_ms:  ['p(95)<1000'],  // 입찰→ACK 95%가 1초 이내
    latency_e2e_ms:         ['p(95)<10000'], // 전체 흐름 95%가 10초 이내
  },
};

export function setup() {
  console.log('🚀 1000명 유저 로그인 시작...');
  const tokens = [];

  for (let i = 1; i <= 1000; i++) {
    const res = http.post(
      `${HTTP_BASE}/auth/login`,
      JSON.stringify({ email: `uniquetest${i}@k6.com`, password: 'password123!' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200) {
      const token = JSON.parse(res.body).data?.accessToken;
      if (token) tokens.push(`Bearer ${token}`);
    } else {
      console.error(`[Setup] 로그인 실패: uniquetest${i}@k6.com → HTTP ${res.status}`);
    }

    if (i % 100 === 0) {
      console.log(`진행중: ${i}/1000, 성공: ${tokens.length}`);
    }
  }

  if (tokens.length === 0) throw new Error('❌ 로그인된 유저가 없습니다!');
  console.log(`✅ 로그인 완료: ${tokens.length}/1000`);
  return { tokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) return;

  const userIndex = __VU - 1;
  if (userIndex >= data.tokens.length) return;

  const token     = data.tokens[userIndex];
  const bidAmount = BID_MIN + (userIndex % (BID_MAX - BID_MIN));

  // ① 전체 시작 시각
  const t_start = Date.now();

  ws.connect(WS_BASE, { headers: { Authorization: token } }, function (socket) {
    let bidAcked      = false;
    let statsReceived = false;
    let t_ws_open     = null;  // ① WS 연결 완료
    let t_stomp_conn  = null;  // ② STOMP CONNECTED
    let t_bid_sent    = null;  // ④ 입찰 발송

    socket.on('open', () => {
      t_ws_open = Date.now();
      latencyWsConnect.add(t_ws_open - t_start);  // ① WS 연결 시간

      socket.send(
        `CONNECT\naccept-version:1.1,1.0\nhost:j14d105.p.ssafy.io\n` +
        `heart-beat:10000,10000\nAuthorization:${token}\n\n\0`
      );
    });

    socket.on('message', (raw) => {

      if (raw.startsWith('CONNECTED')) {
        t_stomp_conn = Date.now();
        latencyStompConnect.add(t_stomp_conn - t_start);  // ② STOMP 연결 시간

        socket.send(`SUBSCRIBE\nid:sub-private\ndestination:/user/private/streams/${STREAM_ID}\n\n\0`);
        socket.send(`SUBSCRIBE\nid:sub-broadcast\ndestination:/broadcast/streams/${STREAM_ID}\n\n\0`);
        socket.send(`SUBSCRIBE\nid:sub-errors\ndestination:/user/private/errors\n\n\0`);

        socket.setTimeout(() => {
          const bidPayload = {
            eventType: 'UNIQUE_BID_PLACE',
            payload: { auctionId: AUCTION_ID, amount: bidAmount }
          };
          socket.send(
            `SEND\ndestination:/app/streams/${STREAM_ID}\n` +
            `content-type:application/json\n\n${JSON.stringify(bidPayload)}\0`
          );
          t_bid_sent = Date.now();  // ④ 입찰 발송 시각
          bidSentCount.add(1);
        }, 500);
      }

      if (raw.startsWith('MESSAGE')) {
        const body   = raw.substring(raw.indexOf('\n\n') + 2).replace(/\0$/, '');
        const parsed = JSON.parse(body);

        if (parsed.eventType === 'UNIQUE_BID_ACK') {
          if (t_bid_sent) {
            latencyBidToAck.add(Date.now() - t_bid_sent);  // ⑤ 입찰→ACK
          }
          bidAckCount.add(1);
          bidAcked = true;
        }

        if (parsed.eventType === 'UNIQUE_AUCTION_STATS') {
          if (t_bid_sent && !statsReceived) {
            latencyBidToStats.add(Date.now() - t_bid_sent);  // ⑥ 입찰→STATS (최초 1회)
          }
          statsReceivedCount.add(1);
          statsReceived = true;
        }

        if (parsed.eventType === 'ERROR') {
          stompErrorCount.add(1);
          wsErrors.add(true);
          bidSuccessRate.add(false);
          socket.close();
          return;
        }

        if (bidAcked && statsReceived) {
          latencyE2E.add(Date.now() - t_start);  // 전체 E2E
          bidSuccessRate.add(true);
          socket.close();
        }
      }

      if (raw.startsWith('ERROR')) {
        stompErrorCount.add(1);
        wsErrors.add(true);
        bidSuccessRate.add(false);
        socket.close();
      }
    });

    socket.setTimeout(() => socket.close(), 20000);
  });
}

export function handleSummary(data) {
  return generateUniqueAuctionSummary(data, 'unique_auction_03_load');
}