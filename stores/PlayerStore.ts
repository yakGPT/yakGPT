import { create } from "zustand";
import { combine } from "zustand/middleware";

export const usePlayerStore = create(
  combine(
    {
      isPlaying: false,
      trackProgress: 0,
    },
    (set) => ({
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setTrackProgress: (trackProgress: number) => set({ trackProgress }),
    })
  )
);
