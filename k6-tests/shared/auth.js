// shared/auth.js
import http from 'k6/http';
import { SharedArray } from 'k6/data';

// ✅ BASE_URL은 http://... 형태로 환경변수로만 받아오고, 코드에서 직접 붙임
const BASE = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');

export const TEST_USERS = new SharedArray('users', function () {
  return JSON.parse(open('../users.json'));
});

export function loginAll() {
  return TEST_USERS.map((user) => {
    const res = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { api: 'auth_login_setup' },
      }
    );

    if (res.status !== 200) {
      console.error(`[Setup] 로그인 실패: ${user.email} → ${res.status}`);
      console.log('응답 바디:', res.body);
      return null;
    }

    try {
      const body = JSON.parse(res.body);
      const token = body.data?.accessToken;
      if (!token) {
        console.log('로그인 응답에는 accessToken이 없음:', body);
        return null;
      }
      return `Bearer ${token}`;
    } catch (e) {
      console.log('로그인 응답 파싱 실패:', e);
      return null;
    }
  }).filter(Boolean); // null 제거
}

export function reLogin(user) {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { api: 'auth_login_refresh' },
    }
  );

  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      const token = body.data?.accessToken;
      return token ? `Bearer ${token}` : null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function authHeader(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': token,
  };
}
