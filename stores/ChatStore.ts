import { create } from "zustand";
import { Message } from "./Message";
import { persist } from "zustand/middleware";
import { Chat } from "./Chat";
import { SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import type { AudioChunk } from "./PlayerActions";

export type APIState = "idle" | "loading" | "error";
export type AudioState = "idle" | "recording" | "transcribing" | "processing";

export const excludeFromState = [
  "currentAbortController",
  "recorder",
  "recognizer",
  "recorderTimeout",
  "textInputValue",
  "apiState",
  "audioState",
  "submitNextAudio",
  "audioChunks",
  "ttsID",
  "ttsText",
  "activeChatId",
  "playerRef",
  "playerRefInit",
  "playerState",
  "playerAudioQueue",
  "playerIdx",
];

interface SettingsForm {
  // GPT
  model: string;
  temperature: number;
  top_p: number;
  n: number;
  stop: string;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  logit_bias: string;
  auto_title: boolean;
  // Whisper
  auto_detect_language: boolean;
  spoken_language: string;
  spoken_language_code: string;
  // ElevenLabs
  voice_id: string;
  // Azure
  voice_id_azure: string;
  auto_detect_language_azure: boolean;
  spoken_language_azure: string;
  spoken_language_code_azure: string;
  spoken_language_style: string;
  submit_debounce_ms: number;
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
  auto_title: true,
  // Whisper
  auto_detect_language: false,
  spoken_language: "English (en)",
  spoken_language_code: "en",
  // ElevenLabs
  voice_id: "21m00Tcm4TlvDq8ikWAM",
  // Azure
  voice_id_azure: "en-US-JaneNeural",
  auto_detect_language_azure: true,
  spoken_language_azure: "English (US)",
  spoken_language_code_azure: "en-US",
  spoken_language_style: "friendly",
  submit_debounce_ms: 0,
};

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
  recognizer: SpeechRecognizer | undefined;
  recorderTimeout: ReturnType<typeof setTimeout> | undefined;
  submitNextAudio: boolean;
  audioState: AudioState;
  audioChunks: BlobPart[];
  playerMode: boolean;
  editingMessage: Message | undefined;

  ttsID: string | undefined;
  ttsText: string | undefined;
  playerRef: React.MutableRefObject<HTMLAudioElement | null>;
  playerRefInit: boolean;
  playerIdx: number;
  playerState: "playing" | "paused" | "idle";
  playerApiState: APIState;
  playerAudioQueue: AudioChunk[];

  showTextDuringPTT: boolean;
  autoSendStreamingSTT: boolean;
  modelChoicesChat: string[] | undefined;
  modelChoiceTTS: string | undefined;
  modelChoiceSTT: string | undefined;
  textInputValue: string;
}
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
  recognizer: undefined,
  recorderTimeout: undefined,
  submitNextAudio: true,
  audioState: "idle" as AudioState,
  audioChunks: [],
  showTextDuringPTT: true,
  ttsID: undefined,
  ttsText: undefined,
  playerRef: { current: null },
  playerRefInit: false,
  playerIdx: -1,
  playerState: "idle",
  playerApiState: "idle",
  playerAudioQueue: [],

  autoSendStreamingSTT: true,
  modelChoicesChat: undefined,
  modelChoiceChat: undefined,
  modelChoiceTTS: "azure",
  modelChoiceSTT: "azure",
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
