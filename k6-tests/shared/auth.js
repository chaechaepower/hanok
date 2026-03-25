import http from 'k6/http';

// 환경변수 또는 기본 URL 설정
const BASE = (__ENV.BASE_URL || 'http://j14d105.p.ssafy.io:8080/api/v1').replace(/\/+$/, '');

// 🌟 JSON 파일 없이, 스크립트 실행 시점에 1000명 유저 정보 자동 생성!
export const TEST_USERS = [];
for (let i = 1; i <= 1000; i++) {
  TEST_USERS.push({
    email: `uniquetest${i}@k6.com`,
    // 🚨 주의: DB에 넣었던 해시값('$2b$10$YGVv...')의 '진짜 평문 비밀번호'를 아래에 꼭 적어주세요!
    password: 'password123!', 
  });
}

export function loginAll() {
  console.log(`🚀 ${TEST_USERS.length}명의 유저 로그인 시도 중...`);
  
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
      console.error(`[Setup] 로그인 실패: ${user.email} → HTTP ${res.status}`);
      return null;
    }

    try {
      const body = JSON.parse(res.body);
      const token = body.data?.accessToken;
      if (!token) {
        console.error('로그인 응답에 accessToken이 없습니다:', body);
        return null;
      }
      return `Bearer ${token}`;
    } catch (e) {
      console.error('로그인 응답 JSON 파싱 실패:', e);
      return null;
    }
  }).filter(Boolean); // 실패해서 null이 된 값들은 배열에서 제거
}

export function authHeader(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': token,
  };
}