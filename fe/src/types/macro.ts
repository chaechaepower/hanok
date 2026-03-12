export type Macro = {
  questionType: string;
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
  macros: Macro[];
};
