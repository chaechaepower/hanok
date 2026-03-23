import ws from 'k6/ws';
import { sleep } from 'k6';
import { Rate } from 'k6/metrics'; // ✅ 추가
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const WS_BASE = __ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws';

const wsErrors = new Rate('ws_errors'); // ✅ 추가

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'unique_auction', scenario: 'smoke' },
  vus: 5,
  duration: '3m',
  thresholds: {
    ws_errors: ['rate==0'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];

  // ✅ 파라미터에 api 태그 추가
  const wsParams = {
    headers: { Authorization: token },
    tags: { api: 'ws_connect' }
  };

  ws.connect(`${WS_BASE}`, wsParams, function (socket) {
    socket.on('open', () => {
      socket.send(`CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\nAuthorization:${token}\n\n\0`);

      const bidPayload = {
        eventType: 'UNIQUE_BID_PLACE',
        payload: { auctionId: 1, amount: 50000 + __VU * 1000 },
      };
      socket.send(
        `SEND\ndestination:/app/streams/1\ncontent-type:application/json\n\n${JSON.stringify(bidPayload)}\0`
      );

      socket.setTimeout(() => socket.close(), 1000);
    });

    socket.on('error', (e) => {
      console.error(`WS 에러: ${e}`);
      wsErrors.add(1, { api: 'ws_connect_error' }); // ✅ 에러 태깅
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'unique_auction_01_smoke');
}