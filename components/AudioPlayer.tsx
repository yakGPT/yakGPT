import { useEffect, useRef, useState } from "react";
import { genAudio as genAudioAzure } from "@/stores/AzureSDK";
import { genAudio as genAudio11Labs } from "@/stores/ElevenLabs";
import { useChatStore } from "@/stores/ChatStore";
import { usePlayerStore } from "@/stores/PlayerStore";
import { notifications } from "@mantine/notifications";

const DEFAULT_AZURE_VOICE = "en-US-JaneNeural";
const DEFAULT_11LABS_VOICE = "21m00Tcm4TlvDq8ikWAM";

const AudioStreamPlayer = () => {
  const audioRef = useRef(new Audio());

  const modelChoiceTTS = useChatStore((state) => state.modelChoiceTTS);
  const pickedState = useChatStore((state) => ({
    apiKeyAzure: state.apiKeyAzure,
    apiKeyAzureRegion: state.apiKeyAzureRegion,
    apiKey11Labs: state.apiKey11Labs,
    settingsForm: {
      voice_id: state.settingsForm.voice_id,
      voice_id_azure: state.settingsForm.voice_id_azure,
      spoken_language_style: state.settingsForm.spoken_language_style,
    },
  }));

  let apiKey: string | undefined;
  let apiKeyRegion: string | undefined;
  let voiceId: string | undefined;
  let voiceStyle: string | undefined;
  let genAudio: typeof genAudioAzure | typeof genAudio11Labs;

  if (modelChoiceTTS === "azure") {
    apiKey = pickedState.apiKeyAzure;
    apiKeyRegion = pickedState.apiKeyAzureRegion;
    voiceId = pickedState.settingsForm.voice_id_azure || DEFAULT_AZURE_VOICE;
    voiceStyle = pickedState.settingsForm.spoken_language_style;
    genAudio = genAudioAzure;
  } else {
    apiKey = pickedState.apiKey11Labs;
    voiceId = pickedState.settingsForm.voice_id || DEFAULT_11LABS_VOICE;
    genAudio = genAudio11Labs;
  }

  const ttsText = useChatStore((state) => state.ttsText);
  const ttsID = useChatStore((state) => state.ttsID);

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
      if (!apiKey) {
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
          const audioURL = await genAudio({
            text: ttsText,
            key: apiKey,
            region: apiKeyRegion,
            voice: voiceId,
            style: voiceStyle,
          });
          if (audioURL) {
            console.log("url", audioURL);
            setAudioSrc(audioURL);
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
  }, [ttsText, ttsID, setIsPlaying, apiKey, apiKeyRegion]);

  return <audio ref={audioRef} playsInline />;
};

export default AudioStreamPlayer;
