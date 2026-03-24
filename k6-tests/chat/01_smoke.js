import ws from 'k6/ws';
import { sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { generateSummary } from '../shared/summary.js';
import { loginAll } from '../shared/auth.js';

// ✅ 올바른 WebSocket 엔드포인트 적용
const WS_BASE = (__ENV.WS_BASE_URL || 'ws://j14d105.p.ssafy.io:8080/ws-connect').replace(/\/+$/, '');

// ✅ 메트릭
const wsErrors        = new Rate('ws_errors');
const chatSuccessRate = new Rate('chat_success_rate');
const chatSentCount   = new Counter('chat_sent_count');
const chatReceivedCount = new Counter('chat_received_count');
const stompErrorCount = new Counter('stomp_error_count');

export const options = {
  tags: {
    domain:   'chat',
    scenario: 'smoke',
  },
  vus: 5,
  duration: '3m',
  thresholds: {
    ws_errors:        ['rate == 0'],
    chat_success_rate: ['rate > 0.99'],
  },
};

export function setup() {
  const tokens = loginAll();
  console.log(`✅ 로그인 완료: ${tokens.length}개 토큰 발급`);
  return { tokens };
}

export default function (data) {
  if (!data.tokens || data.tokens.length === 0) {
    console.log('Setup에서 토큰이 없어서 SKIP');
    return;
  }

  const token = data.tokens[(__VU - 1) % data.tokens.length];

  const wsParams = {
    headers: {
      Authorization: token,
    },
    tags: { api: 'ws_connect' },
  };

  ws.connect(WS_BASE, wsParams, function (socket) {
    let messageSent   = false;
    let messageAcked  = false;
    let stompErrorSeen = false;

    // 1. OPEN
    socket.on('open', () => {
      // ✅ STOMP 1.1 규격에 맞게 host 헤더 포함 필수
      socket.send(
        `CONNECT\naccept-version:1.1,1.0\nhost:j14d105.p.ssafy.io\nheart-beat:10000,10000\nAuthorization:${token}\n\n\0`
      );
    });

    // 2. MESSAGE
    socket.on('message', (raw) => {
      // 2-1. CONNECTED → SUBSCRIBE + SEND
      if (raw.startsWith('CONNECTED')) {
        socket.send(
          `SUBSCRIBE\nid:sub-0\ndestination:/broadcast/streams/1\n\n\0`
        );

        const chatPayload = {
          eventType: 'CHAT_MESSAGE',
          payload: { content: '안녕하세요! Smoke 테스트입니다.' },
        };
        socket.send(
          `SEND\ndestination:/app/streams/1\ncontent-type:application/json\n\n${JSON.stringify(chatPayload)}\0`
        );
        chatSentCount.add(1, { api: 'chat_send', vu: __VU.toString() });
        messageSent = true;
      }

      // 2-2. MESSAGE (채팅 브로드캐스트)
      if (raw.startsWith('MESSAGE')) {
        try {
          const bodyStart = raw.indexOf('\n\n') + 2;
          const body      = bodyStart === -1 ? raw : raw.substring(bodyStart).replace(/\0$/, '');
          const parsed    = JSON.parse(body);

          if (
            parsed.eventType === 'CHAT_MESSAGE' &&
            parsed.payload?.streamId != null &&
            parsed.payload?.content != null
          ) {
            chatReceivedCount.add(1, { api: 'chat_receive', vu: __VU.toString() });
            chatSuccessRate.add(true, { api: 'chat_business_ok', vu: __VU.toString() });
            messageAcked = true;
          } else {
            chatSuccessRate.add(false, { reason: 'invalid_payload', vu: __VU.toString() });
          }
        } catch (e) {
          chatSuccessRate.add(false, { reason: 'parse_error', vu: __VU.toString() });
        }
      }

      // 2-3. STOMP ERROR 프레임
      if (raw.startsWith('ERROR')) {
        stompErrorCount.add(1, { vu: __VU.toString() });
        wsErrors.add(1, { api: 'stomp_error_frame', vu: __VU.toString() });
        chatSuccessRate.add(false, { reason: 'stomp_error', vu: __VU.toString() });
        stompErrorSeen = true;
      }
    });

    // 3. SOCKET ERROR
    socket.on('error', (e) => {
      wsErrors.add(1, { api: 'ws_connect_error', vu: __VU.toString() });
      chatSuccessRate.add(false, { reason: 'socket_error', vu: __VU.toString() });
    });

    // 4. 2초 안에 응답/에러 없으면 실패로 기록 후 종료
    socket.setTimeout(() => {
      if (messageSent && !messageAcked && !stompErrorSeen) {
        chatSuccessRate.add(false, { reason: 'no_response', vu: __VU.toString() });
      }
      socket.close();
    }, 2000);
  });

  sleep(1);
}

export function handleSummary(data) {
  return generateSummary(data, 'chat_01_smoke');
}