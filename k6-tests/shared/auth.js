import http from 'k6/http';
import { SharedArray } from 'k6/data';

const BASE = __ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1';

const TEST_USERS = new SharedArray('users', function () {
  return JSON.parse(open('../users.json'));
});

export function loginAll() {
  return TEST_USERS.map((user) => {
    const res = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { api: 'auth_login' } // ✅ HTTP 요청에 API 태그 추가
      }
    );

    if (res.status !== 200) {
      console.error(`로그인 실패: ${user.email} → ${res.status} ${res.body}`);
      return null;
    }

    const body = JSON.parse(res.body);
    return `Bearer ${body.data.accessToken}`;
  }).filter(Boolean);
}

export function authHeader(tokens) {
  const token = tokens[(__VU - 1) % tokens.length];
  return {
    'Authorization': token,
    'Content-Type': 'application/json',
  };
}