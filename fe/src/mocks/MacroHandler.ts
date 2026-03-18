import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import { getCategoryLabel } from '@/constants/category';
import { CATEGORY_MACROS } from '@/constants/macro';
import type { GetStreamMacrosResponse, Macro, PostStreamMacrosRequest, PostStreamMacrosResponse } from '@/types';

const savedMacros: Record<number, { category: string; macros: Macro[] }> = {};

const getDefaultMacros = (category: string): Macro[] => {
  const label = getCategoryLabel(category);
  const templates = CATEGORY_MACROS[label] ??
    CATEGORY_MACROS[category] ?? [
      { questionType: 'CONDITION', answer: '' },
      { questionType: 'DEFECT', answer: '' },
      { questionType: 'SHIPPING', answer: '' },
    ];

  return templates.map((template) => ({
    questionType: template.questionType,
    answer: template.answer,
  }));
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

    const merged: Macro[] = body.macros.map((macro) => ({
      questionType: macro.questionType,
      answer: macro.answer,
    }));

    const existingCategory = savedMacros[streamId]?.category ?? '';
    savedMacros[streamId] = { category: existingCategory, macros: merged };

    const response: PostStreamMacrosResponse = {
      macros: merged,
    };
    return HttpResponse.json(response, { status: 200 });
  }),
];
