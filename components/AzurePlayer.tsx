import { useEffect, useRef, useState } from "react";
import { genAudio } from "@/stores/AzureSDK";
import { useChatStore } from "@/stores/ChatStore";
import { usePlayerStore } from "@/stores/PlayerStore";
import { notifications } from "@mantine/notifications";

const DEFAULT_VOICE = "en-US-JaneNeural";

const AudioStreamPlayer = () => {
  const audioRef = useRef(new Audio());
  const apiKeyAzure = useChatStore((state) => state.apiKeyAzure);
  const apiKeyAzureRegion = useChatStore((state) => state.apiKeyAzureRegion);
  const ttsText = useChatStore((state) => state.ttsText);
  const ttsID = useChatStore((state) => state.ttsID);
  const voiceId =
    useChatStore((state) => state.settingsForm.voice_id_azure) || DEFAULT_VOICE;
  const voiceStyle = useChatStore(
    (state) => state.settingsForm.spoken_language_style
  );

  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  const { duration } = audioRef.current;

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, duration]);

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
    }
  }, [audioSrc]);

  const initialRender = useRef(true);
  useEffect(() => {
    // Do not play audio on initial render
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (!ttsText) {
      return;
    }
    const fetchAndPlayAudioStream = async () => {
      if (isPlaying) setIsPlaying(false);
      if (!apiKeyAzure || !apiKeyAzureRegion) {
        notifications.show({
          title: "Azure Speech API keys not set",
          message: "Please set the Azure Speech API keys in the settings.",
          color: "red",
        });
        return;
      }
      if (audioRef.current) {
        const audioSrc = audioRef.current.src;
        console.log("called for text", ttsText, "and voiceId", voiceId);
        let audioStream: ReadableStream<Uint8Array>;
        try {
          const audioData = await genAudio(
            ttsText,
            apiKeyAzure,
            apiKeyAzureRegion,
            voiceId,
            voiceStyle
          );
          if (audioData) {
            const blob = new Blob([audioData], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);
            console.log("url", url);
            setAudioSrc(url);
          }
        } catch (error) {
          console.error(error);
          return;
        }

        audioRef.current.addEventListener("canplay", () => {
          setIsPlaying(true);
        });
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
        });
      }
    };

    fetchAndPlayAudioStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsText, ttsID, setIsPlaying, apiKeyAzure, apiKeyAzureRegion]);

  return <audio ref={audioRef} playsInline />;
};

export default AudioStreamPlayer;
