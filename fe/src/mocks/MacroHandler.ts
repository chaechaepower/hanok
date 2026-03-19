import { http, HttpResponse } from 'msw';

import { BASE_URL } from '@/api/instance';
import { getCategoryMacroTemplates } from '@/constants/macro';
import type { GetStreamMacrosResponse, Macro, PostStreamMacrosRequest, PostStreamMacrosResponse } from '@/types';

const savedMacros: Record<number, { category: string; macros: Macro[] }> = {};

export const getSavedMacroAnswer = (streamId: number, questionType: string) =>
  savedMacros[streamId]?.macros.find((macro) => macro.questionType === questionType)?.answer ?? '';

const getDefaultMacros = (category: string): Macro[] => {
  const templates = getCategoryMacroTemplates(category);

  if (templates.length === 0) {
    return [
      { questionType: 'CONDITION', answer: '' },
      { questionType: 'DEFECT', answer: '' },
      { questionType: 'SHIPPING', answer: '' },
    ];
  }

  return templates.map((template) => ({
    questionType: template.questionType,
    answer: '',
  }));
};

export const macroHandlers = [
  http.get(`${BASE_URL}/v1/streams/:streamId/macros`, ({ params, request }) => {
    const streamId = Number(params.streamId);
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? '';

    const saved = savedMacros[streamId];
    const resolvedCategory = saved?.category || category;
    const savedAnswerMap = new Map((saved?.macros ?? []).map((macro) => [macro.questionType, macro.answer]));
    const macros = getDefaultMacros(resolvedCategory).map((macro) => ({
      questionType: macro.questionType,
      answer: savedAnswerMap.get(macro.questionType) ?? '',
    }));

    const response: GetStreamMacrosResponse = {
      streamId,
      category: resolvedCategory,
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
