export const modelInfos: Record<
  string,
  {
    displayName: string;
    maxTokens: number;
    costPer1kTokens: { prompt: number; completion: number };
  }
> = {
  "gpt-3.5-turbo": {
    displayName: "ChatGPT-3.5 Turbo",
    maxTokens: 16 * 1024,
    costPer1kTokens: { prompt: 0.001, completion: 0.002 },
  },
  "gpt-3.5-turbo-16k": {
    displayName: "ChatGPT-3.5 Turbo (16k)",
    maxTokens: 16 * 1024,
    costPer1kTokens: { prompt: 0.001, completion: 0.002 },
  },
  "gpt-3.5-turbo-instruct": {
    displayName: "ChatGPT-3.5 Instruct",
    maxTokens: 4 * 1024,
    costPer1kTokens: { prompt: 0.0015, completion: 0.002 },
  },
  "gpt-4": {
    displayName: "GPT-4",
    maxTokens: 8 * 1024,
    costPer1kTokens: { prompt: 0.03, completion: 0.06 },
  },
  "gpt-4-32k": {
    displayName: "GPT-4 (32k)",
    maxTokens: 8 * 1024,
    costPer1kTokens: { prompt: 0.06, completion: 0.12 },
  },
  "gpt-4-1106-preview": {
    displayName: "GPT-4 Turbo",
    maxTokens: 128 * 1024,
    costPer1kTokens: { prompt: 0.01, completion: 0.03 },
  },
  "gpt-4-1106-vision-preview": {
    displayName: "GPT-4 Turbo Vision",
    maxTokens: 128 * 1024,
    costPer1kTokens: { prompt: 0.01, completion: 0.03 },
  },
};

export const getModelInfo = (model: string) =>
  modelInfos[model] || {
    displayName: model,
    maxTokens: 4096,
    costPer1kTokens: { prompt: 0, completion: 0 },
  };
