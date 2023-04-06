import { v4 as uuidv4 } from "uuid";
import { notifications } from "@mantine/notifications";
import { useChatStore } from "./ChatStore";
import { submitMessage } from "./SubmitMessage";

import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";
import { addChat } from "./ChatActions";
import { NextRouter } from "next/router";

const get = useChatStore.getState;
const set = useChatStore.setState;

export const startRecording = async (router: NextRouter) => {
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
      if (get().autoSendStreamingSTT) {
        if (!get().activeChatId) {
          addChat(router);
        }
        submitMessage({
          id: uuidv4(),
          content: text,
          role: "user",
        });
        set((state) => ({ textInputValue: "" }));
      }
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
  const { recognizer } = get();
  recognizer?.stopContinuousRecognitionAsync();
  set((state) => ({ audioState: "idle" }));
};

export const destroyRecorder = async () => {
  console.log("Destroying recorder...", get().recorder);
  stopRecording(false);
};
