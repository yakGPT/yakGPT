import { genAudio as genAudioAzure } from "@/stores/AzureSDK";
import { genAudio as genAudio11Labs } from "@/stores/ElevenLabs";

import { useChatStore } from "./ChatStore";
import { notifications } from "@mantine/notifications";

const DEFAULT_AZURE_VOICE = "en-US-JaneNeural";
const DEFAULT_11LABS_VOICE = "21m00Tcm4TlvDq8ikWAM";

const get = useChatStore.getState;
const set = useChatStore.setState;

export interface AudioChunk {
  blobURL: string;
  state: "text" | "loading" | "audio";
  text: string;
}

interface VarsShape {
  apiKey: string | undefined;
  apiKeyRegion?: string | undefined;
  voiceId: string | undefined;
  voiceStyle?: string | undefined;
  genAudio: typeof genAudioAzure | typeof genAudio11Labs;
}

const getVars = (): VarsShape => {
  const state = get();

  return state.modelChoiceTTS === "azure"
    ? {
        apiKey: state.apiKeyAzure,
        apiKeyRegion: state.apiKeyAzureRegion,
        voiceId: state.settingsForm.voice_id_azure || DEFAULT_AZURE_VOICE,
        voiceStyle: state.settingsForm.spoken_language_style,
        genAudio: genAudioAzure,
      }
    : {
        apiKey: state.apiKey11Labs,
        voiceId: state.settingsForm.voice_id || DEFAULT_11LABS_VOICE,
        genAudio: genAudio11Labs,
      };
};

function splitSentences(text: string | undefined) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
  const chunks = [];

  // Load the first chunks quickly, expanding as we go on
  const chunksSizes = [25, 100, 200, 500, 1000];

  let chunk = "";
  for (const sentence of sentences) {
    chunk += sentence;
    const thisChunkSize =
      chunksSizes[Math.min(chunks.length, chunksSizes.length - 1)];
    if (chunk.length >= thisChunkSize) {
      chunks.push(chunk);
      chunk = "";
    }
  }

  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  return chunks;
}

const chunkify = (text: string | undefined) => {
  const sentences = splitSentences(text);

  return sentences.map((sentence) => ({
    text: sentence,
    state: "text" as AudioChunk["state"],
    blobURL: "",
  }));
};

export const initPlayback = () => {
  const { apiKey } = getVars();
  if (!apiKey) {
    notifications.show({
      title: "API keys for TTS not set",
      message: "Please set API keys for TTS in the settings.",
      color: "red",
    });
    return;
  }

  const checker = async () => {
    const { apiState, ttsText, playerApiState, playerAudioQueue } = get();
    const chunks = chunkify(ttsText);
    if (apiState === "loading") {
      // Remove the last "unfinished sentence" if we are loading
      chunks.pop();
    }

    if (chunks.length > playerAudioQueue.length) {
      const newElems = chunks.splice(playerAudioQueue.length);
      set({ playerAudioQueue: [...(playerAudioQueue || []), ...newElems] });
    }

    const firstIdleChunk = get().playerAudioQueue.findIndex(
      (chunk) => chunk.state === "text"
    );

    if (firstIdleChunk !== -1 && playerApiState === "idle") {
      // We need to get more audio
      await fetchAudio(firstIdleChunk);
    }
  };
  const interval = setInterval(checker, 1000);
  // Trigger immediately
  checker();

  const ref = new Audio();

  set({
    playerRef: { current: ref },
    playerIdx: -1,
    playerState: "idle",
    playerApiState: "idle",
    playerAudioQueue: [],
  });

  return () => {
    clearInterval(interval);
  };
};

export const playAudio = (idx: number) => {
  const { playerIdx, playerAudioQueue, playerRef, playerState } = get();
  if (playerState === 'playing') {
    console.log('player is still playing, skipping playing');
    return;
  }
  if (playerIdx + 1 >= playerAudioQueue.length) {
    console.log('next chunk is not queued, skipping playing');
    return;
  }
  if (playerAudioQueue[playerIdx + 1].state !== 'audio') {
    console.log('next chunk does not have audio, skipping playing');
    return;
  }
  set({
    playerIdx: playerIdx + 1,
    playerState: "playing",
  });
  if (playerRef.current) {
    playerRef.current.src = playerAudioQueue[playerIdx + 1].blobURL;
    ensureListeners(playerRef.current);

    playerRef.current.play();
  }
};

const fetchAudio = async (idx: number) => {
  const { apiKey, apiKeyRegion, voiceId, voiceStyle, genAudio } = getVars();
  const { playerAudioQueue } = get();

  const chunk = playerAudioQueue[idx];
  if (!chunk) {
    return;
  }

  if (!apiKey) {
    return;
  }

  set({ playerApiState: "loading" });

  try {
    const audioURL = await genAudio({
      text: chunk.text,
      key: apiKey,
      region: apiKeyRegion,
      voice: voiceId,
      style: voiceStyle,
    });
    if (audioURL) {
      set({
        playerAudioQueue: playerAudioQueue.map((chunk, i) =>
          i === idx ? { ...chunk, blobURL: audioURL, state: "audio" } : chunk
        ),
      });
      if (get().playerState === "idle") {
        playAudio(idx);
      }
    }
  } catch (error) {
    console.error(error);
  }

  set({ playerApiState: "idle" });
};

const ensureListeners = (audio: HTMLAudioElement) => {
  if (get().playerRefInit) return;
  set({ playerRefInit: true });

  audio.addEventListener("ended", () => {
    const { playerIdx, playerAudioQueue } = get();
    set({ playerState: "idle" });
    if (playerIdx + 1 < playerAudioQueue.length) {
      playAudio(playerIdx + 1);
    }
  });
};

export const toggleAudio = () => {
  const { playerState, playerRef } = get();
  if (playerState === "playing") {
    if (playerRef.current) {
      playerRef.current.pause();
    }
    set({ playerState: "paused" });
  } else if (playerState === "paused") {
    if (playerRef.current) {
      playerRef.current.play();
    }
    set({ playerState: "playing" });
  } else if (playerState === "idle") {
    playAudio(0);
  }
};
