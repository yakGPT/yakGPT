import { v4 as uuidv4 } from "uuid";
import { Message } from "./Message";
import { streamCompletion } from "./OpenAI";
import { getChatById, updateChatMessages } from "./utils";
import { notifications } from "@mantine/notifications";
import { getModelInfo } from "./Model";
import { useChatStore } from "./ChatStore";

const get = useChatStore.getState;
const set = useChatStore.setState;

export const abortCurrentRequest = () => {
  const currentAbortController = get().currentAbortController;
  if (currentAbortController?.abort) currentAbortController?.abort();
  set((state) => ({
    apiState: "idle",
    currentAbortController: undefined,
  }));
};

export const submitMessage = async (message: Message) => {
  // If message is empty, do nothing
  if (message.content.trim() === "") {
    console.error("Message is empty");
    return;
  }

  const activeChatId = get().activeChatId;
  const chat = get().chats.find((c) => c.id === activeChatId!);
  if (chat === undefined) {
    console.error("Chat not found");
    return;
  }
  console.log("chat", chat.id);

  // If this is an existing message, remove all the messages after it
  const index = chat.messages.findIndex((m) => m.id === message.id);
  if (index !== -1) {
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.id === chat.id) {
          c.messages = c.messages.slice(0, index);
        }
        return c;
      }),
    }));
  }

  // Add the message
  set((state) => ({
    apiState: "loading",
    chats: state.chats.map((c) => {
      if (c.id === chat.id) {
        c.messages.push(message);
      }
      return c;
    }),
  }));

  const assistantMsgId = uuidv4();
  // Add the assistant's response
  set((state) => ({
    chats: state.chats.map((c) => {
      if (c.id === state.activeChatId) {
        c.messages.push({
          id: assistantMsgId,
          content: "",
          role: "assistant",
          loading: true,
        });
      }
      return c;
    }),
  }));

  const apiKey = get().apiKey;
  if (apiKey === undefined) {
    console.error("API key not set");
    return;
  }

  const updateTokens = (tokensUsed: number) => {
    const activeModel = get().settingsForm.model;
    const costPer1kTokens = getModelInfo(activeModel).costPer1kTokens;
    set((state) => ({
      apiState: "idle",
      chats: state.chats.map((c) => {
        if (c.id === chat.id) {
          c.tokensUsed = (c.tokensUsed || 0) + tokensUsed;
          c.costIncurred =
            (c.costIncurred || 0) + (tokensUsed / 1000) * costPer1kTokens;
        }
        return c;
      }),
    }));
  };
  const settings = get().settingsForm;

  const abortController = new AbortController();
  set((state) => ({
    currentAbortController: abortController,
    ttsID: assistantMsgId,
    ttsText: "",
  }));

  // ASSISTANT REQUEST
  await streamCompletion(
    chat.messages,
    settings,
    apiKey,
    abortController,
    (content) => {
      set((state) => ({
        ttsText: (state.ttsText || "") + content,
        chats: updateChatMessages(state.chats, chat.id, (messages) => {
          const assistantMessage = messages.find(
            (m) => m.id === assistantMsgId
          );
          if (assistantMessage) {
            assistantMessage.content += content;
          }
          return messages;
        }),
      }));
    },
    (tokensUsed) => {
      set((state) => ({
        apiState: "idle",
        chats: updateChatMessages(state.chats, chat.id, (messages) => {
          const assistantMessage = messages.find(
            (m) => m.id === assistantMsgId
          );
          if (assistantMessage) {
            assistantMessage.loading = false;
          }
          return messages;
        }),
      }));
      updateTokens(tokensUsed);
      if (get().settingsForm.auto_title) {
        findChatTitle();
      }
    },
    (errorRes, errorBody) => {
      let message = errorBody;
      try {
        message = JSON.parse(errorBody).error.message;
      } catch (e) {}

      notifications.show({
        message: message,
        color: "red",
      });
      // Run abortCurrentRequest to remove the loading indicator
      abortCurrentRequest();
    }
  );

  const findChatTitle = async () => {
    const chat = getChatById(get().chats, get().activeChatId);
    if (chat === undefined) {
      console.error("Chat not found");
      return;
    }
    // Find a good title for the chat
    const numWords = chat.messages
      .map((m) => m.content.split(" ").length)
      .reduce((a, b) => a + b, 0);
    if (
      chat.messages.length >= 2 &&
      chat.title === undefined &&
      numWords >= 4
    ) {
      const msg = {
        id: uuidv4(),
        content: `Describe the following conversation snippet in 3 words or less.
              >>>
              Hello
              ${chat.messages
                .slice(1)
                .map((m) => m.content)
                .join("\n")}
              >>>
                `,
        role: "system",
      } as Message;

      await streamCompletion(
        [msg, ...chat.messages.slice(1)],
        settings,
        apiKey,
        undefined,
        (content) => {
          set((state) => ({
            chats: state.chats.map((c) => {
              if (c.id === chat.id) {
                // Find message with id
                chat.title = (chat.title || "") + content;
                if (chat.title.toLowerCase().startsWith("title:")) {
                  chat.title = chat.title.slice(6).trim();
                }
                // Remove trailing punctuation
                chat.title = chat.title.replace(/[,.;:!?]$/, "");
              }
              return c;
            }),
          }));
        },
        updateTokens
      );
    }
  };
};
