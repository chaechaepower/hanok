import ws from 'k6/ws';
import { sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const WS_BASE = __ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws';
const BASELINE_VUS = __ENV.BASELINE || 300;

const wsSessions = new Counter('ws_sessions');
const wsErrors = new Rate('ws_errors');
const stressLatency = new Trend('stress_latency');

export const options = {
  // ✅ 전역 태그 추가
  tags: { domain: 'unique_auction', scenario: 'stress' },
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: BASELINE_VUS },
        { duration: '10m', target: Math.floor(BASELINE_VUS * 1.5) },
        { duration: '5m', target: 0 },
        { duration: '5m', target: 10 },
      ],
    },
  },
  thresholds: {
    ws_errors: ['rate<0.05'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const amount = 50000 + Math.floor(Math.random() * 1000) * 1000;
  const startTime = Date.now();

  // ✅ 파라미터에 api 태그 추가
  const wsParams = {
    headers: { Authorization: token },
    tags: { api: 'ws_connect' }
  };

  ws.connect(`${WS_BASE}`, wsParams, function (socket) {
    socket.on('open', () => {
      wsSessions.add(1, { api: 'ws_connect' }); // ✅
      stressLatency.add(Date.now() - startTime, { api: 'ws_connect' }); // ✅
      socket.send(`CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\nAuthorization:${token}\n\n\0`);

      const bidPayload = {
        eventType: 'UNIQUE_BID_PLACE',
        payload: { auctionId: 1, amount },
      };
      socket.send(
        `SEND\ndestination:/app/streams/1\ncontent-type:application/json\n\n${JSON.stringify(bidPayload)}\0`
      );

      socket.setTimeout(() => socket.close(), 1000);
    });

    socket.on('error', () => wsErrors.add(1, { api: 'ws_connect_error' })); // ✅
  });

  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'unique_auction_03_stress');
}