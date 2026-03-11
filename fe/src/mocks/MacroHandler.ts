import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';
import { CATEGORY_MACROS } from '@/constants/macro';
import type { Macro, GetStreamMacrosResponse, PostStreamMacrosRequest, PostStreamMacrosResponse } from '@/types';
const savedMacros: Record<number, { category: string; macros: Macro[] }> = {};

const getDefaultMacros = (category: string): Macro[] => {
  const templates = CATEGORY_MACROS[category] ?? [
    { questionType: 'CONDITION', question: '전반적인 상태는?', answer: '' },
    { questionType: 'DEFECT',    question: '하자 여부는?', answer: '' },
    { questionType: 'SHIPPING',  question: '배송 방법은?', answer: '' },
  ];
  return templates.map((t) => ({ questionType: t.questionType, answer: t.answer }));
};

export const macroHandlers = [
  http.get(`${BASE_URL}/v1/streams/:streamId/macros`, ({ params, request }) => {
    const streamId = Number(params.streamId);
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? '';

    const saved = savedMacros[streamId];
    const macros = saved?.macros ?? getDefaultMacros(category);

    const response: GetStreamMacrosResponse = {
      streamId,
      category: saved?.category ?? category,
      macros,
    };
    return HttpResponse.json(response, { status: 200 });
  }),

  http.post(`${BASE_URL}/v1/streams/:streamId/macros`, async ({ params, request }) => {
    const streamId = Number(params.streamId);
    const body = (await request.json()) as PostStreamMacrosRequest;

    const merged: Macro[] = body.macros.map((m) => ({
      questionType: m.questionType,
      answer: m.answer,
    }));

    const existingCategory = savedMacros[streamId]?.category ?? '';
    savedMacros[streamId] = { category: existingCategory, macros: merged };

    const response: PostStreamMacrosResponse = {
      streamId,
      macroCount: merged.length,
      cachedAt: new Date().toISOString(),
    };
    return HttpResponse.json(response, { status: 200 });
  }),
];
