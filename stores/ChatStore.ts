import { create } from "zustand";
import { Message } from "./Message";
import { persist } from "zustand/middleware";
import { Chat } from "./Chat";

export type APIState = "idle" | "loading" | "error";
export type AudioState = "idle" | "recording" | "transcribing" | "processing";

export const excludeFromState = [
  "currentAbortController",
  "recorder",
  "recorderTimeout",
  "textInputValue",
  "apiState",
  "audioState",
  "submitNextAudio",
  "audioChunks",
  "ttsID",
  "ttsText",
  "activeChatId",
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

export interface ChatState {
  apiState: APIState;
  apiKey: string | undefined;
  apiKey11Labs: string | undefined;
  apiKeyAzure: string | undefined;
  apiKeyAzureRegion: string | undefined;
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
  modelChoiceChat: string | undefined;
  modelChoiceTTS: string | undefined;
  modelChoiceSTT: string | undefined;
  textInputValue: string;
}

export const defaultSettings = {
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

export const initialState = {
  apiState: "idle" as APIState,
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || undefined,
  apiKey11Labs: process.env.NEXT_PUBLIC_11LABS_API_KEY || undefined,
  apiKeyAzure: process.env.NEXT_PUBLIC_AZURE_API_KEY || undefined,
  apiKeyAzureRegion: process.env.NEXT_PUBLIC_AZURE_REGION || undefined,
  chats: [],
  activeChatId: undefined,
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
  modelChoiceChat: undefined,
  modelChoiceTTS: undefined,
  modelChoiceSTT: undefined,
  textInputValue: "",
};

const store = () => ({ ...initialState } as ChatState);

export const useChatStore = create<ChatState>()(
  persist(store, {
    name: "chat-store-v23",
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(([key]) => !excludeFromState.includes(key))
      ),
  })
);
