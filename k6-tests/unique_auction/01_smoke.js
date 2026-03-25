import ws from 'k6/ws';
import http from 'k6/http';
import { Counter, Rate } from 'k6/metrics';
import { generateUniqueAuctionSummary } from '../shared/summary.js';

const HTTP_BASE  = (__ENV.BASE_URL    || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');
const WS_BASE    = (__ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws-connect').replace(/\/+$/, '');
const STREAM_ID  = 61;
const AUCTION_ID = 70;
const BID_MIN    = 10000;
const BID_MAX    = 100000;

const wsErrors           = new Rate('ws_errors');
const bidSuccessRate     = new Rate('bid_success_rate');
const bidSentCount       = new Counter('bid_sent_count');
const bidAckCount        = new Counter('bid_ack_count');
const statsReceivedCount = new Counter('stats_received_count');

export const options = {
  tags: { domain: 'unique_auction', scenario: 'smoke' },
  vus: 5,
  iterations: 5,
  thresholds: {
    ws_errors:        ['rate==0'],
    bid_success_rate: ['rate==1.0'],
  },
};

export function setup() {
  console.log('🚀 스모크 테스트용 로그인 시작...');
  const tokens = [];

  for (let i = 1; i <= 5; i++) {
    const res = http.post(
      `${HTTP_BASE}/auth/login`,
      JSON.stringify({ email: `uniquetest${i}@k6.com`, password: 'password123!' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200) {
      const token = JSON.parse(res.body).data?.accessToken;
      if (token) tokens.push(`Bearer ${token}`);
    } else {
      console.error(`❌ 로그인 실패: uniquetest${i}@k6.com (HTTP ${res.status})`);
    }
  }

  console.log(`✅ 로그인 성공 토큰 수: ${tokens.length}/5`);
  return { tokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) {
    console.error('❌ 토큰 없음');
    return;
  }

  const token = data.tokens[__VU - 1];
  if (!token) {
    console.error(`❌ VU${__VU} 토큰 없음`);
    return;
  }

  // VU마다 고유한 입찰 금액 (유효 범위 내)
  const bidAmount = BID_MIN + (__VU * 1000);  // 11000, 12000, 13000, 14000, 15000

  ws.connect(WS_BASE, { headers: { Authorization: token } }, function (socket) {
    let bidAcked      = false;
    let statsReceived = false;

    socket.on('open', () => {
      console.log(`✅ VU${__VU} WebSocket 연결 성공`);
      socket.send(
        `CONNECT\naccept-version:1.1,1.0\nhost:j14d105.p.ssafy.io\n` +
        `heart-beat:10000,10000\nAuthorization:${token}\n\n\0`
      );
    });

    socket.on('message', (raw) => {

      if (raw.startsWith('CONNECTED')) {
        console.log(`✅ VU${__VU} STOMP CONNECTED`);
        socket.send(`SUBSCRIBE\nid:sub-private\ndestination:/user/private/streams/${STREAM_ID}\n\n\0`);
        socket.send(`SUBSCRIBE\nid:sub-broadcast\ndestination:/broadcast/streams/${STREAM_ID}\n\n\0`);

        socket.setTimeout(() => {
          const bidPayload = {
            eventType: 'UNIQUE_BID_PLACE',
            payload: { auctionId: AUCTION_ID, amount: bidAmount }
          };
          socket.send(
            `SEND\ndestination:/app/streams/${STREAM_ID}\n` +
            `content-type:application/json\n\n${JSON.stringify(bidPayload)}\0`
          );
          bidSentCount.add(1);
          console.log(`✅ VU${__VU} 입찰 발송: ${bidAmount}`);
        }, 500);
      }

      if (raw.startsWith('MESSAGE')) {
        const body   = raw.substring(raw.indexOf('\n\n') + 2).replace(/\0$/, '');
        const parsed = JSON.parse(body);

        if (parsed.eventType === 'UNIQUE_BID_ACK') {
          const amount = parsed.payload?.amount;
          console.log(`✅ VU${__VU} BID_ACK 수신: amount=${amount}`);
          bidAckCount.add(1);
          bidAcked = true;
        }

        if (parsed.eventType === 'UNIQUE_AUCTION_STATS') {
          const participantCount = parsed.payload?.participantCount;
          console.log(`✅ VU${__VU} STATS 수신: participantCount=${participantCount}`);
          statsReceivedCount.add(1);
          statsReceived = true;
        }

        if (bidAcked && statsReceived) {
          bidSuccessRate.add(true);
          console.log(`🎉 VU${__VU} 테스트 성공! (ACK+STATS 완료)`);
          socket.close();
        }
      }

      if (raw.startsWith('ERROR')) {
        console.error(`🚨 VU${__VU} STOMP 에러: ${raw}`);
        wsErrors.add(true);
        bidSuccessRate.add(false);
        socket.close();
      }
    });

    socket.setTimeout(() => {
      console.log(`⚠️ VU${__VU} 타임아웃 종료`);
      socket.close();
    }, 10000);
  });
}

export function handleSummary(data) {
  return generateUniqueAuctionSummary(data, 'unique_auction_01_smoke');
}