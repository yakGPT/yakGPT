export const modelInfos: Record<
  string,
  {
    displayName: string;
    maxTokens: number;
    costPer1kTokens: number;
  }
> = {
  "gpt-3.5-turbo": {
    displayName: "ChatGPT-3.5",
    maxTokens: 4096,
    costPer1kTokens: 0.0015,
  },
  "gpt-3.5-turbo-0301": {
    displayName: "ChatGPT-3.5 March 1",
    maxTokens: 4096,
    costPer1kTokens: 0.0015,
  },
  "gpt-3.5-turbo-0613": {
    displayName: "ChatGPT-3.5 June 13",
    maxTokens: 4096,
    costPer1kTokens: 0.0015,
  },
  "gpt-3.5-turbo-16k": {
    displayName: "ChatGPT-3.5 June 13",
    maxTokens: 16384,
    costPer1kTokens: 0.003,
  },
  "gpt-3.5-turbo-16k-0613": {
    displayName: "ChatGPT-3.5 June 13",
    maxTokens: 16384,
    costPer1kTokens: 0.003,
  },
  "gpt-4": {
    displayName: "GPT-4",
    maxTokens: 8192,
    costPer1kTokens: 0.03,
  },
  "gpt-4-0613": {
    displayName: "GPT-4 June 13",
    maxTokens: 8192,
    costPer1kTokens: 0.03,
  },
};

export const getModelInfo = (model: string) =>
  modelInfos[model] || {
    displayName: model,
    maxTokens: 4096,
    costPer1kTokens: 0.0,
  };
