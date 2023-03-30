export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  loading?: boolean;
}

// Helper function to estimate tokens
function estimateTokens(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words * (100 / 75));
}

// Truncate messages
export function truncateMessages(
  messages: Message[],
  maxTokens: number = 3600
): Message[] {
  if (messages.length <= 1) return messages;

  let accumulatedTokens = estimateTokens(messages[0].content);
  const ret = [messages[0]];

  // Keep adding messages from the end of the array until we reach the max tokens
  for (let i = messages.length - 1; i >= 1; i--) {
    const message = messages[i];
    const tokens = estimateTokens(message.content);
    if (accumulatedTokens + tokens > maxTokens) {
      break;
    }
    accumulatedTokens += tokens;
    // Insert at position 1
    ret.splice(1, 0, message);
  }
  return ret;
}
