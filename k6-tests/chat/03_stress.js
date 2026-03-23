import ws from 'k6/ws';
import { sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const WS_BASE = __ENV.WS_BASE_URL || 'wss://j14d105.p.ssafy.io/ws';
const STREAM_ID = __ENV.STREAM_ID || 1;
const BASELINE_VUS = __ENV.BASELINE || 300;

const wsSessions = new Counter('ws_sessions');
const wsErrors = new Rate('ws_errors');

export const options = {
  // ✅ 전역 태그 설정
  tags: {
    domain: 'chat',
    scenario: 'stress',
  },
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: BASELINE_VUS },
        { duration: '5m', target: Math.floor(BASELINE_VUS * 1.5) },
        { duration: '3m', target: 0 },
        { duration: '3m', target: 10 },
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

  // ✅ null 대신 태그 객체 전달
  const wsParams = { tags: { api: 'ws_connect' } };

  ws.connect(`${WS_BASE}?token=${token}`, wsParams, function (socket) {
    socket.on('open', () => {
      wsSessions.add(1, { api: 'ws_connect' }); // ✅ 
      socket.send(`CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\nAuthorization:${token}\n\n\0`);

      const intervalId = setInterval(() => {
        const chatPayload = {
          eventType: 'CHAT_MESSAGE',
          payload: { content: 'Stress 테스트 중입니다.' },
        };
        socket.send(
          `SEND\ndestination:/app/streams/${STREAM_ID}\ncontent-type:application/json\n\n${JSON.stringify(chatPayload)}\0`
        );
      }, 1000);

      socket.setTimeout(() => {
        clearInterval(intervalId);
        socket.close();
      }, 30000);
    });

    socket.on('error', () => wsErrors.add(1, { api: 'ws_connect_error' })); // ✅
  });
  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'chat_03_stress');
}