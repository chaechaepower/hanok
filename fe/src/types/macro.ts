export type MacroQuestionType =
  | 'WEARABLE_SIZE'
  | 'WEARABLE_WORN_COUNT'
  | 'WEARABLE_BOX_TAG'
  | 'WEARABLE_WASHING'
  | 'CONDITION'
  | 'SHIPPING'
  | 'DEFECT'
  | string;

export type Macro = {
  questionType: string; // API 명세서대로 string 사용, 혹은 MacroQuestionType
  answer: string;
};

export type GetStreamMacrosResponse = {
  streamId: number;
  category: string;
  macros: Macro[];
};

export type PostStreamMacrosRequest = {
  macros: Macro[];
};

export type PostStreamMacrosResponse = {
  streamId: number;
  macroCount: number;
  cachedAt: string;
};
