import ws from 'k6/ws';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution'; // ✅ 현재 활성 VUser 수를 가져오기 위한 모듈
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

const WS_BASE = (__ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws-connect').replace(/\/+$/, '');
const STREAM_ID = __ENV.STREAM_ID || 1;

// ✅ 메트릭
const wsErrors          = new Rate('ws_errors');
const chatSuccessRate   = new Rate('chat_success_rate');
const chatSentCount     = new Counter('chat_sent_count');
const chatReceivedCount = new Counter('chat_received_count');
const stompErrorCount   = new Counter('stomp_error_count');

// ✅ 서버가 터지는 시점의 VUser 수를 기록할 커스텀 메트릭
const breakingPointVUs  = new Trend('breaking_point_vus');

export const options = {
  tags: {
    domain: 'chat',
    scenario: 'stepup',
  },
  scenarios: {
    step_up: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 500 },
        { duration: '2m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    ws_errors: ['rate<0.05'], // 에러율 5% 미만 유지 (초과 시 실패 처리)
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) return;

  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const wsParams = {
    headers: { Authorization: token },
    tags: { api: 'ws_connect' },
  };

  ws.connect(WS_BASE, wsParams, function (socket) {

    // 1. 연결 시 CONNECT 프레임
    socket.on('open', () => {
      socket.send(
        `CONNECT\naccept-version:1.1,1.0\nhost:j14d105.p.ssafy.io\nheart-beat:10000,10000\nAuthorization:${token}\n\n\0`
      );
    });

    // 2. 메시지 수신 및 이벤트 처리
    socket.on('message', (raw) => {
      // CONNECTED 응답 성공 시 구독 및 주기적 채팅 전송 시작
      if (raw.startsWith('CONNECTED')) {
        socket.send(
          `SUBSCRIBE\nid:sub-0\ndestination:/broadcast/streams/${STREAM_ID}\n\n\0`
        );

        socket.setInterval(() => {
          const chatPayload = {
            eventType: 'CHAT_MESSAGE',
            payload: { content: `StepUp 테스트 중 [VU:${__VU}]` },
          };
          socket.send(
            `SEND\ndestination:/app/streams/${STREAM_ID}\ncontent-type:application/json\n\n${JSON.stringify(chatPayload)}\0`
          );
          chatSentCount.add(1, { api: 'chat_send' });
        }, 2000);
      }

      // 메시지 수신 성공
      if (raw.startsWith('MESSAGE')) {
        chatReceivedCount.add(1, { api: 'chat_receive' });
        chatSuccessRate.add(true, { api: 'chat_business_ok' });
      }

      // STOMP 에러 발생 (서버가 비즈니스 로직을 처리하지 못함)
      if (raw.startsWith('ERROR')) {
        stompErrorCount.add(1, { api: 'stomp_error' });
        wsErrors.add(1, { api: 'stomp_error_frame' });
        chatSuccessRate.add(false, { reason: 'stomp_error' });

        // ✅ 에러가 터진 시점의 활성 유저 수를 Trend에 기록
        breakingPointVUs.add(exec.instance.vusActive);
      }
    });

    // 소켓 에러 발생 (서버 커넥션 드랍 등)
    socket.on('error', () => {
      wsErrors.add(1, { api: 'ws_connect_error' });
      chatSuccessRate.add(false, { reason: 'socket_error' });

      // ✅ 소켓 에러 시점의 활성 유저 수를 Trend에 기록
      breakingPointVUs.add(exec.instance.vusActive);
    });

    // 10초 타임아웃
    socket.setTimeout(() => {
      socket.close();
    }, 10000);
  });

  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'chat_02_stepup');
}