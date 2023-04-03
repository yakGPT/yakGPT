import { useEffect, useRef, useState } from "react";
import { genAudio } from "@/stores/ElevenLabs";
import { useChatStore } from "@/stores/ChatStore";
import { usePlayerStore } from "@/stores/PlayerStore";

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

const AudioStreamPlayer = () => {
  const audioRef = useRef(new Audio());
  const apiKey11Labs = useChatStore((state) => state.apiKey11Labs);
  const ttsText = useChatStore((state) => state.ttsText);
  const ttsID = useChatStore((state) => state.ttsID);
  const voiceId =
    useChatStore((state) => state.settingsForm.voice_id) || DEFAULT_VOICE;

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
      if (audioRef.current) {
        const audioSrc = audioRef.current.src;
        console.log("called for text", ttsText, "and voiceId", voiceId);
        let audioStream: ReadableStream<Uint8Array>;
        try {
          audioStream = await genAudio({
            apiKey: apiKey11Labs!,
            text: ttsText,
            voiceId,
          });
        } catch (error) {
          console.error(error);
          return;
        }

        // Create a MediaSource object
        const mediaSource = new MediaSource();
        audioRef.current.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener("sourceopen", () => {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");

          // Read and process the audio stream
          const processStream = async (
            streamReader: ReadableStreamDefaultReader<Uint8Array>
          ) => {
            const { done, value } = await streamReader.read();

            if (done) {
              // Signal that we've processed all available data
              if (!sourceBuffer.updating) {
                mediaSource.endOfStream();
              } else {
                sourceBuffer.addEventListener(
                  "updateend",
                  () => {
                    mediaSource.endOfStream();
                  },
                  { once: true }
                );
              }
            } else {
              const appendAndUpdate = (chunkValue: Uint8Array) => {
                sourceBuffer.appendBuffer(chunkValue);
                processStream(streamReader);
              };

              // Append the data to the source buffer
              if (sourceBuffer.updating) {
                sourceBuffer.addEventListener(
                  "updateend",
                  () => {
                    appendAndUpdate(value);
                  },
                  { once: true }
                );
              } else {
                appendAndUpdate(value);
              }
            }
          };

          const streamReader = audioStream.getReader();
          processStream(streamReader);
        });

        audioRef.current.addEventListener("canplay", () => {
          setIsPlaying(true);
        });
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
        });
      }
    };

    fetchAndPlayAudioStream();
  }, [apiKey11Labs, ttsText, ttsID, setIsPlaying]);

  return <audio ref={audioRef} playsInline />;
};

export default AudioStreamPlayer;
