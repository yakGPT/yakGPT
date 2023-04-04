import { IncomingMessage } from "http";
import https from "https";
import { Message, truncateMessages, countTokens } from "./Message";
import { getModelInfo } from "./Model";
import axios from "axios";

export function assertIsError(e: any): asserts e is Error {
  if (!(e instanceof Error)) {
    throw new Error("Not an error");
  }
}

async function fetchFromAPI(endpoint: string, key: string) {
  try {
    const res = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    return res;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.error(e.response?.data);
    }
    throw e;
  }
}

export async function testKey(key: string): Promise<boolean> {
  try {
    const res = await fetchFromAPI("https://api.openai.com/v1/models", key);
    return res.status === 200;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response!.status === 401) {
        return false;
      }
    }
  }
  return false;
}

export async function fetchModels(key: string): Promise<string[]> {
  try {
    const res = await fetchFromAPI("https://api.openai.com/v1/models", key);
    console.log(res.data.data);
    return res.data.data.map((model: any) => model.id);
  } catch (e) {
    return [];
  }
}

export async function _streamCompletion(
  payload: string,
  apiKey: string,
  abortController?: AbortController,
  callback?: ((res: IncomingMessage) => void) | undefined,
  errorCallback?: ((res: IncomingMessage, body: string) => void) | undefined
) {
  const req = https.request(
    {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: abortController?.signal,
    },
    (res) => {
      if (res.statusCode !== 200) {
        let errorBody = "";
        res.on("data", (chunk) => {
          errorBody += chunk;
        });
        res.on("end", () => {
          errorCallback?.(res, errorBody);
        });
        return;
      }
      callback?.(res);
    }
  );

  req.write(payload);

  req.end();
}

interface ChatCompletionParams {
  model: string;
  temperature: number;
  top_p: number;
  n: number;
  stop: string;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  logit_bias: string;
}

const paramKeys = [
  "model",
  "temperature",
  "top_p",
  "n",
  "stop",
  "max_tokens",
  "presence_penalty",
  "frequency_penalty",
  "logit_bias",
];


export async function streamCompletion(
  messages: Message[],
  params: ChatCompletionParams,
  apiKey: string,
  abortController?: AbortController,
  callback?: ((res: IncomingMessage) => void) | undefined,
  endCallback?: ((tokensUsed: number) => void) | undefined,
  errorCallback?: ((res: IncomingMessage, body: string) => void) | undefined
) {

  // Get model information based on completion parameters
  const modelInfo = getModelInfo(params.model);

  // Truncate messages to fit within maxTokens parameter
  const submitMessages = truncateMessages(
    messages,
    modelInfo.maxTokens,
    params.max_tokens
  );

  // Log information about the submitted messages
  console.log(`Sending ${submitMessages.length} messages:`);
  console.log(submitMessages.map((m) => m.content.slice(0, 50)).join("\n"));

  // Filter completion parameters based on a list of valid keys
  const submitParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => paramKeys.includes(key))
  );

  // Construct payload to be sent to API endpoint
  const payload = JSON.stringify({
    messages: submitMessages.map(({ role, content }) => ({ role, content })),
    stream: true,
    ...{
      ...submitParams,
      logit_bias: JSON.parse(params.logit_bias || "{}"),
      // 0 == unlimited
      max_tokens: params.max_tokens || undefined,
    },
  });

  // Initialize buffer for completed messages
  let buffer = "";

  // Define success callback to handle response from API endpoint
  const successCallback = (res: IncomingMessage) => {
    res.on("data", (chunk) => {
      // Handle abort signal from AbortController
      if (abortController?.signal.aborted) {
        res.destroy();
        endCallback?.(0);
        return;
      }

      // Split response into individual messages
      const allMessages = chunk.toString().split("\n\n");
      for (const message of allMessages) {
        // Remove first 5 characters ("data:") of response
        const cleaned = message.toString().slice(5);

        // Break function if current chunk is last ("data: [DONE]")
        if (cleaned === " [DONE]") {
          return;
        }

        // Parse chunk
        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.error(e)
          return;
        }

        // Append parsed chunk to buffer if it has content
        const content = parsed.choices[0]?.delta?.content;
        if (content === undefined) {
          continue;
        }
        buffer += content;

        // Call optional callback function for each completed message
        callback?.(content);
      }
    });

    // Call optional endCallback function when stream ends
    res.on("end", () => {
      // Count the tokens used in the original messages and the received completions
      const tokensUsed =
        countTokens(submitMessages.map((m) => m.content).join("\n")) +
        countTokens(buffer);

      // Call the endCallback function if it exists, passing in the number of tokens used
      endCallback?.(tokensUsed);
    });
  };
  // Call the _streamCompletion function with the given payload, API key, abortController, successCallback and errorCallback.
  return _streamCompletion(
    payload,
    apiKey,
    abortController,
    successCallback,
    errorCallback
  );

}
