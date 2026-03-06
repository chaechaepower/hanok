import { BASE_URL } from "@/api/instance";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post(`${BASE_URL}/v1/sellers/register`, async () => {
    // API 명세서에 맞는 응답값 반환
    return HttpResponse.json({
      sellerId: 101,
      nickname: "Mock 판매자",
      grade: "A"
    }, { status: 200 });
  }),

];
