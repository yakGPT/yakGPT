import { v4 as uuidv4 } from "uuid";
import { notifications } from "@mantine/notifications";
import { useChatStore } from "./ChatStore";
import { submitMessage } from "./SubmitMessage";

import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";
import { addChat } from "./ChatActions";
import { NextRouter } from "next/router";
import { debounce } from "lodash";

const get = useChatStore.getState;
const set = useChatStore.setState;

export const startRecording = async (router: NextRouter) => {
  let recorder = get().recorder;
  console.log("start");
  clearTimeout(get().recorderTimeout);
  const { apiKeyAzure, apiKeyAzureRegion } = get();

  let textUpdates: string[] = [];

  const persistText = (text: string) => {
    const effectiveInputValue = `${get().textInputValue} `;
    set((state) => ({
      textInputValue: effectiveInputValue,
    }));
    if (get().autoSendStreamingSTT) {
      if (!get().activeChatId) {
        addChat(router);
      }
      submitMessage({
        id: uuidv4(),
        content: effectiveInputValue,
        role: "user",
      });
      set((state) => ({ textInputValue: "" }));
      textUpdates = [];
    }
  };
  const { submit_debounce_ms: submitDebounce  } = get().settingsForm;
  const debouncedPersistText = debounce(persistText, submitDebounce);

  const updateText = (text: string, recognitionComplete: boolean) => {
    text = text.trim();
    set((state) => ({
      textInputValue: `${textUpdates.join(" ")} ${text}`,
    }));
    if (recognitionComplete) {
      textUpdates.push(text);
    }
  };

  const updateAndEventuallyPersistText = (text: string, recognitionComplete: boolean) => {
    updateText(text, recognitionComplete);
    if (submitDebounce) {
      debouncedPersistText(text);
    } else if (recognitionComplete) {
      persistText(text);
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

  const { auto_detect_language_azure, spoken_language_code_azure } =
    get().settingsForm;

  if (!auto_detect_language_azure && spoken_language_code_azure) {
    speechConfig.speechRecognitionLanguage = spoken_language_code_azure;
  }

  const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

  set((state) => ({ recognizer }));

  recognizer.recognizing = (s, e) => {
    console.log(`RECOGNIZING: Text=${e.result.text}`);
    updateAndEventuallyPersistText(e.result.text, false);
  };

  recognizer.recognized = (s, e) => {
    let resultText = e.result.text.trim();
    if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech && resultText) {
      console.log(`RECOGNIZED: Text=${resultText}`);
      updateAndEventuallyPersistText(resultText, true);
    } else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
      console.log("NOMATCH: Speech could not be recognized.");
    }
  };

  recognizer.canceled = (s, e) => {
    console.log(`CANCELED: Reason=${e.reason}`);
    debouncedPersistText.cancel();

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
    debouncedPersistText.cancel();
    recognizer.stopContinuousRecognitionAsync();
  };
  console.log("Starting recording...", recorder);

  recognizer.startContinuousRecognitionAsync();

  console.log("Starting recording...", recorder);
  set((state) => ({ audioState: "recording" }));
};

export const stopRecording = async (submit: boolean) => {
  console.log("Stopping recording... submit=", submit);
  const { recognizer } = get();
  recognizer?.stopContinuousRecognitionAsync();
  set((state) => ({ audioState: "idle" }));
};

export const destroyRecorder = async () => {
  console.log("Destroying recorder...", get().recorder);
  stopRecording(false);
};
