import http from 'k6/http';
import { SharedArray } from 'k6/data';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io/api/v1';

// 1. 테스트 유저 데이터 로드 (다른 스크립트에서도 쓸 수 있게 export)
export const TEST_USERS = new SharedArray('users', function () {
  return JSON.parse(open('../users.json'));
});

// 2. Setup 단계용: 전체 유저 초기 로그인
export function loginAll() {
  return TEST_USERS.map((user) => {
    const res = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { api: 'auth_login_setup' }
      }
    );

    if (res.status !== 200) {
      console.error(`[Setup] 로그인 실패: ${user.email} → ${res.status}`);
      return null;
    }

    const body = JSON.parse(res.body);
    return `Bearer ${body.data.accessToken}`;
  });
}

// 3. Main 단계용: 특정 유저의 토큰이 만료되었을 때 갱신하는 헬퍼 함수
export function reLogin(user) {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { api: 'auth_login_refresh' }
    }
  );

  if (res.status === 200) {
    const body = JSON.parse(res.body);
    return `Bearer ${body.data.accessToken}`;
  }
  return null;
}