import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useChatStore } from "@/stores/ChatStore";
import { Message } from "@/stores/Message";
import PushToTalkButton from "./PushToTalkButton";
import { notifications } from "@mantine/notifications";
import { assertIsError } from "@/stores/OpenAI";

const workerOptions = {
  WebMOpusEncoderWasmPath:
    "https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/WebMOpusEncoder.wasm",
};

// @ts-ignore
MediaRecorder = OpusMediaRecorder;

const AudioRecorder = () => {
  const [audioState, setAudioState] = useState("idle");
  const submitAudioRef = useRef<boolean>(true);

  const pushMessage = useChatStore((state) => state.pushMessage);
  const delMessage = useChatStore((state) => state.delMessage);
  const submitMessage = useChatStore((state) => state.submitMessage);
  const setApiState = useChatStore((state) => state.setApiState);

  const apiKey = useChatStore((state) => state.apiKey);
  const pushToTalkMode = useChatStore((state) => state.pushToTalkMode);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const onRecordingDataAvailable = useCallback((e: BlobEvent) => {
    console.log("dataavailable", e.data.size);
    chunks.current.push(e.data);
  }, []);

  const stopRecording = useCallback((submit = true) => {
    // TODO: Cancel current transcription if active

    console.log("Stopping recording... submit=", submit);
    submitAudioRef.current = submit;
    if (recorderRef.current) {
      // Set immediately since the ev handler takes some time
      if (submit) {
        setAudioState("transcribing");
      } else {
        setAudioState("idle");
      }
      if (recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    }
  }, []);

  const destroyRecorder = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stream.getTracks().forEach((i) => i.stop());
      recorderRef.current = null;
    }
  }, []);

  const sendAudioData = useCallback(
    async (blob: Blob) => {
      console.log("Audio data size:", blob.size / 1000, "KB");

      const newMessage = {
        id: uuidv4(),
        content: "",
        role: "user",
      } as Message;

      pushMessage(newMessage);
      setApiState("loading");

      console.log("Sending audio data to OpenAI...");

      try {
        const apiUrl = "https://api.openai.com/v1/audio/transcriptions";

        const formData = new FormData();
        formData.append("file", blob, "audio.webm");
        formData.append("model", "whisper-1");
        formData.append("language", "en");

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

        console.log("Audio data sent successfully:", response.data.text);

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
    [submitMessage, delMessage, pushMessage, apiKey, setApiState]
  );

  const onRecordingStop = useCallback(() => {
    console.log("stop, submit=", submitAudioRef.current);
    const cleanup = () => {
      chunks.current.length = 0;
      setAudioState("idle");
    };

    if (submitAudioRef.current) {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      sendAudioData(blob).then(cleanup, cleanup);
    } else {
      cleanup();
    }
  }, [sendAudioData]);

  const startRecording = useCallback(async () => {
    console.log("start");
    chunks.current.length = 0;

    if (!recorderRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        let options = { mimeType: "audio/webm" };
        // @ts-ignore
        const recorder = new MediaRecorder(stream, options, workerOptions);

        recorder.addEventListener("dataavailable", onRecordingDataAvailable);
        recorder.addEventListener("stop", onRecordingStop);

        recorderRef.current = recorder;
      } catch (err) {
        console.error("Error initializing recorder:", err);
        return;
      }
    }

    if (recorderRef.current) {
      recorderRef.current.start(100);
      setAudioState("recording");
    }
  }, [onRecordingDataAvailable, onRecordingStop]);

  if (!pushToTalkMode) {
    return null;
  }

  return (
    <PushToTalkButton
      audioState={audioState}
      startRecording={startRecording}
      stopRecording={stopRecording}
      destroyRecorder={destroyRecorder}
    />
  );
};

export default AudioRecorder;
