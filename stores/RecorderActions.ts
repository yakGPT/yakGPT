import { v4 as uuidv4 } from "uuid";
import { Message } from "./Message";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { assertIsError } from "@/stores/OpenAI";

import { useChatStore } from "./ChatStore";
import { delMessage, pushMessage, setApiState } from "./ChatActions";
import { submitMessage } from "./SubmitMessage";
import { NextRouter } from "next/router";

const get = useChatStore.getState;
const set = useChatStore.setState;

export const sendAudioData = async (blob: Blob) => {
  const { audioChunks } = get();
  const newMessage = {
    id: uuidv4(),
    content: "",
    role: "user",
  } as Message;

  pushMessage(newMessage);
  setApiState("loading");

  console.log("Sending audio data to OpenAI...", audioChunks.length);

  await submitAudio(newMessage, blob);
};

export const startRecording = async (router: NextRouter) => {
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

      recorder.addEventListener("dataavailable", onRecordingDataAvailable);
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
};

export const stopRecording = async (submit: boolean) => {
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
};

export const destroyRecorder = async () => {
  console.log("Destroying recorder...", get().recorder);
  const { audioChunks, recorder } = get();

  if (recorder) {
    recorder.stream.getTracks().forEach((i) => i.stop());
    set((state) => ({ recorder: undefined }));
  }
};

export const submitAudio = async (newMessage: Message, blob: Blob) => {
  const apiUrl = "https://api.openai.com/v1/audio/transcriptions";

  const { apiKey, settingsForm } = get();
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
};
