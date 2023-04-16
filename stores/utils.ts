import { Chat } from "./Chat";
import { Message } from "./Message";

export const getChatById = (
  chats: Chat[],
  chatId: string | undefined
): Chat | undefined => {
  return chats.find((c) => c.id === chatId);
};

export const updateChatMessages = (
  chats: Chat[],
  chatId: string,
  updateFunc: (messages: Message[]) => Message[]
): Chat[] => {
  return chats.map((c) => {
    if (c.id === chatId) {
      c.messages = updateFunc(c.messages);
    }
    return c;
  });
};

export const hasOwnProperty = <
  X extends Record<string, unknown>,
  Y extends PropertyKey
>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> => {
  return Object.hasOwnProperty.call(obj, prop);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};
