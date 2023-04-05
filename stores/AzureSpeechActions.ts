import { v4 as uuidv4 } from "uuid";
import { Message } from "./Message";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { assertIsError } from "@/stores/OpenAI";

import { useChatStore } from "./ChatStore";
import { delMessage, pushMessage, setApiState } from "./ChatActions";
import { submitMessage } from "./SubmitMessage";

import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";

const get = useChatStore.getState;
const set = useChatStore.setState;

export const startRecording = async () => {
  let recorder = get().recorder;
  console.log("start");
  clearTimeout(get().recorderTimeout);
  const { apiKeyAzure, apiKeyAzureRegion } = get();

  let lastTextUpdate = "";

  const updateText = (text: string, persist: boolean) => {
    // Remove previous text update
    const textInputValue = get().textInputValue;
    const cutText = textInputValue.substring(
      0,
      textInputValue.length - lastTextUpdate.length
    );
    set((state) => ({
      textInputValue: `${cutText}${text}${persist ? " " : ""}`,
    }));
    // Reset if persisting, otherwise update
    if (persist) {
      lastTextUpdate = "";
    } else {
      lastTextUpdate = text;
    }
  };

  if (!apiKeyAzure || !apiKeyAzureRegion) {
    notifications.show({
      title: "Azure Speech API keys not set",
      message: "Please set the Azure Speech API keys in the settings.",
      color: "red",
    });
    return;
  }

  const speechConfig = speechsdk.SpeechConfig.fromSubscription(
    apiKeyAzure,
    apiKeyAzureRegion
  );

  speechConfig.speechRecognitionLanguage = "en-US";

  const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizing = (s, e) => {
    console.log(`RECOGNIZING: Text=${e.result.text}`);
    updateText(e.result.text, false);
  };

  recognizer.recognized = (s, e) => {
    if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) {
      console.log(`RECOGNIZED: Text=${e.result.text}`);
      updateText(e.result.text, true);
    } else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
      console.log("NOMATCH: Speech could not be recognized.");
    }
  };

  recognizer.canceled = (s, e) => {
    console.log(`CANCELED: Reason=${e.reason}`);

    if (e.reason == speechsdk.CancellationReason.Error) {
      console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
      console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
      console.log(
        "CANCELED: Did you set the speech resource key and region values?"
      );
    }

    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.sessionStopped = (s, e) => {
    console.log("\n    Session stopped event.");
    recognizer.stopContinuousRecognitionAsync();
  };
  console.log("Starting recording...", recorder);

  recognizer.startContinuousRecognitionAsync();

  console.log("Starting recording...", recorder);
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
