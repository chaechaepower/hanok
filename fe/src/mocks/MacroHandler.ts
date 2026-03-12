import { http, HttpResponse } from 'msw';
import { BASE_URL } from '@/api/instance';
import { CATEGORY_MACROS } from '@/constants/macro';
import type { Macro, GetStreamMacrosResponse, PostStreamMacrosRequest, PostStreamMacrosResponse } from '@/types';

const CATEGORY_ID_TO_LABEL: Record<string, string> = {
  SNEAKERS_SHOES: '스니커즈/신발',
  CLOTHING: '의류',
  WATCHES: '시계',
  BAGS_FASHION_ACCESSORIES: '가방/패션잡화',
  JEWELRY: '주얼리',
  TRADING_CARDS: '트레이딩 카드',
  FIGURES_PLASTIC_MODELS: '피규어/아트토이/굿즈',
  ELECTRONICS: '전자기기',
  ART: '미술품/판화',
  ANTIQUES_VINTAGE: '골동품/앤틱',
  ETC: '기타',
};

const savedMacros: Record<number, { category: string; macros: Macro[] }> = {};

const getDefaultMacros = (category: string): Macro[] => {
  const label = CATEGORY_ID_TO_LABEL[category] ?? category;
  const templates = CATEGORY_MACROS[label] ?? CATEGORY_MACROS[category] ?? [
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
      macros: merged,
    };
    return HttpResponse.json(response, { status: 200 });
  }),
];
