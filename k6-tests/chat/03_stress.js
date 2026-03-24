import ws from 'k6/ws';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics'; // ✅ Trend 추가
import exec from 'k6/execution'; // ✅ 현재 활성 유저 확인용
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const WS_BASE = (__ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws-connect').replace(/\/+$/, '');
const STREAM_ID = __ENV.STREAM_ID || 1;
const BASELINE_VUS = __ENV.BASELINE || 300;

// 메트릭
const wsErrors          = new Rate('ws_errors');
const chatSuccessRate   = new Rate('chat_success_rate');
const chatSentCount     = new Counter('chat_sent_count');
const chatReceivedCount = new Counter('chat_received_count');
const stompErrorCount   = new Counter('stomp_error_count');

// ✅ 에러가 터지는 순간의 VU 수를 기록할 Trend 메트릭 생성
const breakingPointVUs  = new Trend('breaking_point_vus');

export const options = {
  // ... 기존 options 내용과 동일 ...
  thresholds: {
    ws_errors: ['rate<0.05'],
  },
};

export function setup() {
  const tokens = loginAll();
  return { tokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) return;
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const wsParams = { headers: { Authorization: token }, tags: { api: 'ws_connect' } };

  ws.connect(WS_BASE, wsParams, function (socket) {
    socket.on('open', () => {
      socket.send(`CONNECT\naccept-version:1.1,1.0\nhost:j14d105.p.ssafy.io\nheart-beat:10000,10000\nAuthorization:${token}\n\n\0`);
    });

    socket.on('message', (raw) => {
      if (raw.startsWith('CONNECTED')) {
        socket.send(`SUBSCRIBE\nid:sub-0\ndestination:/broadcast/streams/${STREAM_ID}\n\n\0`);
        socket.setInterval(() => {
          const chatPayload = { eventType: 'CHAT_MESSAGE', payload: { content: `Stress 테스트 중 [VU:${__VU}]` } };
          socket.send(`SEND\ndestination:/app/streams/${STREAM_ID}\ncontent-type:application/json\n\n${JSON.stringify(chatPayload)}\0`);
          chatSentCount.add(1, { api: 'chat_send' });
        }, 1000);
      }

      if (raw.startsWith('MESSAGE')) {
        chatReceivedCount.add(1, { api: 'chat_receive' });
        chatSuccessRate.add(true, { api: 'chat_business_ok' });
      }

      if (raw.startsWith('ERROR')) {
        stompErrorCount.add(1, { api: 'stomp_error' });
        wsErrors.add(1, { api: 'stomp_error_frame' });
        chatSuccessRate.add(false, { reason: 'stomp_error' });

        // ✅ 에러 발생 시 현재 활성 VU 기록
        breakingPointVUs.add(exec.instance.vusActive);
      }
    });

    socket.on('error', () => {
      wsErrors.add(1, { api: 'ws_connect_error' });
      chatSuccessRate.add(false, { reason: 'socket_error' });

      // ✅ 소켓 에러 발생 시 현재 활성 VU 기록
      breakingPointVUs.add(exec.instance.vusActive);
    });

    socket.setTimeout(() => socket.close(), 30000);
  });

  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'chat_03_stress');
}