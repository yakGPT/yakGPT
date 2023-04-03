import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Message } from "./Message";
import { streamCompletion } from "./OpenAI";
import { persist } from "zustand/middleware";
import { Chat } from "./Chat";
import { getChatById, updateChatMessages } from "./utils";
import { notifications } from "@mantine/notifications";
import { getModelInfo } from "./Model";
import { assertIsError } from "@/stores/OpenAI";
import axios from "axios";

type APIState = "idle" | "loading" | "error";
type AudioState = "idle" | "recording" | "transcribing" | "processing";

const excludeFromState = [
  "currentAbortController",
  "recorder",
  "recorderTimeout",
];

interface SettingsForm {
  model: string;
  temperature: number;
  top_p: number;
  n: number;
  stop: string;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  logit_bias: string;
  auto_detect_language: boolean;
  spoken_language: string;
  spoken_language_code: string;
  voice_id: string;
  auto_title: boolean;
  // non-model stuff
  push_to_talk_key: string;
}

interface ChatState {
  apiState: APIState;
  apiKey: string | undefined;
  apiKey11Labs: string | undefined;
  chats: Chat[];
  activeChatId: string | undefined;
  colorScheme: "light" | "dark";
  currentAbortController: AbortController | undefined;
  settingsForm: SettingsForm;
  defaultSettings: SettingsForm;
  navOpened: boolean;
  pushToTalkMode: boolean;
  recorder: MediaRecorder | undefined;
  recorderTimeout: ReturnType<typeof setTimeout> | undefined;
  submitNextAudio: boolean;
  audioState: AudioState;
  audioChunks: BlobPart[];
  playerMode: boolean;
  editingMessage: Message | undefined;
  ttsID: string | undefined;
  ttsText: string | undefined;
  showTextDuringPTT: boolean;

  addChat: (title?: string) => void;
  deleteChat: (id: string) => void;
  clearChats: () => void;
  setActiveChat: (id: string) => void;
  pushMessage: (message: Message) => void;
  delMessage: (message: Message) => void;
  submitMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  setColorScheme: (scheme: "light" | "dark") => void;
  setApiKey: (key: string) => void;
  setApiKey11Labs: (key: string) => void;
  setApiState: (state: APIState) => void;
  updateSettingsForm: (settings: ChatState["settingsForm"]) => void;
  abortCurrentRequest: () => void;
  updateChat: (chat: Partial<Chat>) => void;
  setChosenCharacter: (name: string) => void;
  setNavOpened: (opened: boolean) => void;
  setPushToTalkMode: (mode: boolean) => void;
  setPlayerMode: (mode: boolean) => void;
  setEditingMessage: (id: Message | undefined) => void;
  regenerateAssistantMessage: (message: Message) => void;
  submitAudio: (newMessage: Message, audio: Blob) => Promise<void>;
  sendAudioData: (audio: Blob) => Promise<void>;
  startRecording: () => void;
  stopRecording: (submit: boolean) => void;
  destroyRecorder: () => void;
  setTtsText: (text: string | undefined) => void;
}

const defaultSettings = {
  model: "gpt-3.5-turbo",
  temperature: 1,
  top_p: 1,
  n: 1,
  stop: "",
  max_tokens: 0,
  presence_penalty: 0,
  frequency_penalty: 0,
  logit_bias: "",
  auto_detect_language: false,
  spoken_language: "English (en)",
  spoken_language_code: "en",
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  auto_title: true,
  // non-model stuff
  push_to_talk_key: "KeyC",
};

const initialChatId = uuidv4();

const initialState = {
  apiState: "idle" as APIState,
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || undefined,
  apiKey11Labs: undefined,
  chats: [
    {
      id: initialChatId,
      messages: [],
    },
  ],
  activeChatId: initialChatId,
  colorScheme: "light" as "light" | "dark",
  currentAbortController: undefined,
  settingsForm: defaultSettings,
  defaultSettings: defaultSettings,
  navOpened: false,
  playerMode: false,
  pushToTalkMode: false,
  editingMessage: undefined,
  recorder: undefined,
  recorderTimeout: undefined,
  submitNextAudio: true,
  audioState: "idle" as AudioState,
  audioChunks: [],
  showTextDuringPTT: false,
  ttsID: undefined,
  ttsText: undefined,
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,
      clearChats: () => set(() => ({ chats: [], activeChatId: undefined })),
      deleteChat: (id: string) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
          activeChatId:
            state.activeChatId === id
              ? state.chats[state.chats.length - 1].id
              : state.activeChatId,
        })),
      addChat: (title?: string) => {
        window.scrollTo(0, 0);
        return set((state) => {
          const id = uuidv4();
          return {
            chats: [
              ...state.chats,
              {
                id,
                title: title,
                messages: [],
              },
            ],
            activeChatId: id,
          };
        });
      },
      setActiveChat: (id: string) => set((state) => ({ activeChatId: id })),
      updateMessage: (message: Message) => {
        const chat = getChatById(get().chats, get().activeChatId);
        if (chat === undefined) {
          console.error("Chat not found");
          return;
        }
        set((state) => ({
          chats: updateChatMessages(state.chats, chat.id, (messages) => {
            return messages.map((m) => (m.id === message.id ? message : m));
          }),
        }));
      },
      pushMessage: async (message: Message) => {
        const chat = getChatById(get().chats, get().activeChatId);
        if (chat === undefined) {
          console.error("Chat not found");
          return;
        }
        set((state) => ({
          chats: updateChatMessages(state.chats, chat.id, (messages) => {
            return [...messages, message];
          }),
        }));
      },
      delMessage: async (message: Message) => {
        const chat = getChatById(get().chats, get().activeChatId);
        if (chat === undefined) {
          console.error("Chat not found");
          return;
        }
        set((state) => ({
          chats: updateChatMessages(state.chats, chat.id, (messages) => {
            return messages.filter((m) => m.id !== message.id);
          }),
        }));
      },
      submitMessage: async (message: Message) => {
        // If message is empty, do nothing
        if (message.content.trim() === "") {
          console.error("Message is empty");
          return;
        }
        const chat = get().chats.find((c) => c.id === get().activeChatId);
        if (chat === undefined) {
          console.error("Chat not found");
          return;
        }

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
            if (c.id === chat.id) {
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
        set((state) => ({ currentAbortController: abortController }));

        // ASSISTANT REQUEST
        await streamCompletion(
          chat.messages,
          settings,
          apiKey,
          abortController,
          (content) => {
            set((state) => ({
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
              ttsID: assistantMsgId,
              ttsText: state.chats
                .find((c) => c.id === chat.id)
                ?.messages.find((m) => m.id === assistantMsgId)?.content,
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
            get().abortCurrentRequest();
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
      },
      setColorScheme: (scheme: "light" | "dark") =>
        set((state) => ({ colorScheme: scheme })),
      setApiKey: (key: string) => set((state) => ({ apiKey: key })),
      setApiKey11Labs: (key: string) => set((state) => ({ apiKey11Labs: key })),
      setApiState: (apiState: APIState) => set((state) => ({ apiState })),
      updateSettingsForm: (settingsForm: ChatState["settingsForm"]) =>
        set((state) => ({ settingsForm })),
      abortCurrentRequest: () => {
        const currentAbortController = get().currentAbortController;
        if (currentAbortController?.abort) currentAbortController?.abort();
        set((state) => ({
          apiState: "idle",
          currentAbortController: undefined,
        }));
      },
      updateChat: (options) =>
        set((state) => ({
          chats: state.chats.map((c) => {
            if (c.id === options.id) {
              return { ...c, ...options };
            }
            return c;
          }),
        })),
      setChosenCharacter: (name: string) =>
        set((state) => ({
          chats: state.chats.map((c) => {
            if (c.id === state.activeChatId) {
              c.chosenCharacter = name;
            }
            return c;
          }),
        })),
      setNavOpened: (navOpened: boolean) => set((state) => ({ navOpened })),
      setPushToTalkMode: (pushToTalkMode: boolean) =>
        set((state) => ({ pushToTalkMode })),
      setPlayerMode: (playerMode: boolean) => {
        if (playerMode && !get().apiKey11Labs) {
          notifications.show({
            message:
              'Please enter your ElevenLabs API key in "API Keys" to enable TTS',
          });
          return;
        }
        set((state) => ({ playerMode }));
      },
      setEditingMessage: (editingMessage: Message | undefined) =>
        set((state) => ({ editingMessage })),

      sendAudioData: async (blob: Blob) => {
        const { audioChunks, pushMessage, setApiState, submitAudio } = get();
        const newMessage = {
          id: uuidv4(),
          content: "",
          role: "user",
        } as Message;

        pushMessage(newMessage);
        setApiState("loading");

        console.log("Sending audio data to OpenAI...", audioChunks.length);

        await submitAudio(newMessage, blob);
      },
      startRecording: async () => {
        const { audioChunks, sendAudioData, destroyRecorder } = get();
        let recorder = get().recorder;
        console.log("start");
        set((state) => ({ audioChunks: [] }));
        clearTimeout(get().recorderTimeout);

        const onRecordingDataAvailable = (e: BlobEvent) => {
          console.log("dataavailable", e.data.size);
          set((state) => ({ audioChunks: [...state.audioChunks, e.data] }));
        };

        const onRecordingStop = () => {
          const submitNextAudio = get().submitNextAudio;
          console.log("stop, submit=", submitNextAudio);
          const cleanup = () => {
            set((state) => ({
              audioState: "idle",
              audioChunks: [],
            }));
            set((state) => ({
              recorderTimeout: setTimeout(() => {
                destroyRecorder();
              }, 30_000),
            }));
          };

          if (submitNextAudio) {
            const blob = new Blob(get().audioChunks, { type: "audio/webm" });

            sendAudioData(blob).then(cleanup, cleanup);
          } else {
            cleanup();
          }
        };

        if (!recorder) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            let options = { mimeType: "audio/webm" };

            const workerOptions = {
              WebMOpusEncoderWasmPath:
                "https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/WebMOpusEncoder.wasm",
            };

            // @ts-ignore
            recorder = new window.OpusMediaRecorder(
              stream,
              options,
              workerOptions
            ) as MediaRecorder;

            recorder.addEventListener(
              "dataavailable",
              onRecordingDataAvailable
            );
            recorder.addEventListener("stop", onRecordingStop);

            set((state) => ({ recorder }));
          } catch (err) {
            console.error("Error initializing recorder:", err);
            return;
          }
        }

        console.log("Starting recording...", recorder);
        recorder.start(1_000);
        set((state) => ({ audioState: "recording" }));
      },
      stopRecording: async (submit: boolean) => {
        console.log("Stopping recording... submit=", submit);
        const { audioChunks, recorder, submitNextAudio } = get();

        set((state) => ({ submitNextAudio: submit }));

        if (recorder) {
          // Set immediately since the ev handler takes some time
          if (submit) {
            set((state) => ({ audioState: "transcribing" }));
          } else {
            set((state) => ({ audioState: "idle" }));
          }
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        }
      },
      destroyRecorder: async () => {
        const { audioChunks, recorder } = get();

        if (recorder) {
          recorder.stream.getTracks().forEach((i) => i.stop());
          set((state) => ({ recorder: undefined }));
        }
      },
      submitAudio: async (newMessage: Message, blob: Blob) => {
        const apiUrl = "https://api.openai.com/v1/audio/transcriptions";

        const { apiKey, settingsForm, setApiState, delMessage, submitMessage } =
          get();
        const {
          auto_detect_language: autoDetectLanguage,
          spoken_language_code: spokenLanguageCode,
        } = settingsForm;

        try {
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");
          formData.append("model", "whisper-1");

          if (!autoDetectLanguage && spokenLanguageCode) {
            formData.append("language", spokenLanguageCode);
          }
          const response = await axios.post(apiUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${apiKey}`,
            },
          });

          if (response.data.error) {
            console.error("Error sending audio data:", response.data.error);
            notifications.show({
              title: "Error sending audio data",
              message: response.data.error,
              color: "red",
            });
            return;
          }

          // Empty audio, do nothing
          if (response.data.text === "") {
            setApiState("idle");
            delMessage(newMessage);
            return;
          }
          setApiState("idle");

          submitMessage({
            id: newMessage.id,
            content: response.data.text,
            role: "user",
          });
        } catch (err) {
          assertIsError(err);
          setApiState("idle");
          const message = axios.isAxiosError(err)
            ? err.response?.data?.error?.message
            : err.message;

          notifications.show({
            title: "Error sending audio data",
            message,
            color: "red",
          });
          console.error("Error sending audio data:", err);
        }
      },
      regenerateAssistantMessage: (message: Message) => {
        const chat = getChatById(get().chats, get().activeChatId);
        if (chat === undefined) {
          console.error("Chat not found");
          return;
        }

        // If this is an existing message, remove all the messages after it
        const index = chat.messages.findIndex((m) => m.id === message.id);

        const prevMsg = chat.messages[index - 1];
        if (prevMsg) {
          get().submitMessage(prevMsg);
        }
      },
      setTtsText: (ttsText: string | undefined) =>
        set((state) => ({ ttsText })),
    }),
    {
      name: "chat-store-v23",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !excludeFromState.includes(key)
          )
        ),
    }
  )
);
