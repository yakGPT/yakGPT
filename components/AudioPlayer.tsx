import { useEffect, useRef, useState } from "react";
import { genAudio } from "@/stores/ElevenLabs";
import { useChatStore } from "@/stores/ChatStore";
import { usePlayerStore } from "@/stores/PlayerStore";

interface AudioStreamPlayerProps {
  text: string;
  voiceId: string;
}

const AudioStreamPlayer: React.FC<AudioStreamPlayerProps> = ({
  text,
  voiceId,
}) => {
  const audioRef = useRef(new Audio());
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();
  const apiKey11Labs = useChatStore((state) => state.apiKey11Labs);

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const trackProgress = usePlayerStore((state) => state.trackProgress);
  const setTrackProgress = usePlayerStore((state) => state.setTrackProgress);

  const { duration } = audioRef.current;

  useEffect(() => {
    const startTimer = () => {
      // Clear any timers already running
      clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setTrackProgress(audioRef.current.currentTime);
        console.log("trackProgress", trackProgress, "duration", duration);
      }, 400);
    };

    if (isPlaying) {
      audioRef.current.play();
      startTimer();
    } else {
      clearInterval(intervalRef.current);
      audioRef.current.pause();
    }
  }, [isPlaying, duration, trackProgress]);

  useEffect(() => {
    const fetchAndPlayAudioStream = async () => {
      if (audioRef.current) {
        const audioSrc = audioRef.current.src;
        console.log("called for text", text, "and voiceId", voiceId);
        let audioStream: ReadableStream<Uint8Array>;
        try {
          audioStream = await genAudio({
            apiKey: apiKey11Labs!,
            text,
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
  }, [apiKey11Labs, text, voiceId]);

  return <audio ref={audioRef} playsInline />;
};

export default AudioStreamPlayer;
