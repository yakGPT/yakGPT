import { Message } from "./Message";
import { isObject } from "./utils";

export interface Chat {
  id: string;
  title?: string | undefined;
  messages: Message[];
  chosenCharacter?: string | undefined;
  createdAt?: Date | undefined;
  tokensUsed?: number;
  costIncurred?: number;
}

export const isChat = (value: unknown): value is Chat => {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage)
  );
};

export const isMessage = (value: unknown): value is Message => {
  return (
    isObject(value) &&
    ["id", "content", "role"].every((prop) => typeof value[prop] === "string")
  );
};
