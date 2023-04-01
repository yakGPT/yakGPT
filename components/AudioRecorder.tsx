import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "@/stores/ChatStore";
import { Message } from "@/stores/Message";
import PushToTalkButton from "./PushToTalkButton";

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
  const setApiState = useChatStore((state) => state.setApiState);

  const submitAudio = useChatStore((state) => state.submitAudio);

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

  const cleanupRecorder = useCallback(() => {
    if (recorderRef.current) {
      chunks.current.length = 0;
      setAudioState("idle");
      recorderRef.current &&
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

      await submitAudio(newMessage, blob);
    },
    [pushMessage, setApiState, submitAudio]
  );

  const onRecordingStop = useCallback(() => {
    console.log("stop, submit=", submitAudioRef.current);

    if (submitAudioRef.current) {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      sendAudioData(blob).then(cleanupRecorder, cleanupRecorder);
    } else {
      cleanupRecorder();
    }
  }, [sendAudioData, cleanupRecorder]);

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
    />
  );
};

export default AudioRecorder;
