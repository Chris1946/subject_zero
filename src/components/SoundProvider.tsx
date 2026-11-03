"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  SoundEvent,
  getSoundEngine,
  MUTED_STORAGE_KEY,
  VOLUME_STORAGE_KEY,
} from "@/lib/sound/engine";

interface SoundContextValue {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  play: (event: SoundEvent) => void;
  setRoom: (roomId: number) => void;
  setConnectionStatus: (status: string) => void;
  stopAll: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  isMuted: true,
  volume: 0.5,
  toggleMute: () => {},
  setVolume: () => {},
  play: () => {},
  setRoom: () => {},
  setConnectionStatus: () => {},
  stopAll: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<ReturnType<typeof getSoundEngine> | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(MUTED_STORAGE_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    try {
      const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
      return stored !== null ? parseFloat(stored) : 0.5;
    } catch {
      return 0.5;
    }
  });

  // Lazy-load audio engine on client
  useEffect(() => {
    engineRef.current = getSoundEngine();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        engineRef.current?.pause();
      } else {
        engineRef.current?.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const setVolume = useCallback((newVol: number) => {
    setVolumeState(newVol);
    engineRef.current?.setVolume(newVol);
  }, []);

  const play = useCallback((event: SoundEvent) => {
    engineRef.current?.play(event);
  }, []);

  const setRoom = useCallback((roomId: number) => {
    engineRef.current?.setRoom(roomId);
  }, []);

  const setConnectionStatus = useCallback((status: string) => {
    engineRef.current?.setConnectionStatus(status);
  }, []);

  const stopAll = useCallback(() => {
    engineRef.current?.stopAll();
  }, []);

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        volume,
        toggleMute,
        setVolume,
        play,
        setRoom,
        setConnectionStatus,
        stopAll,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  return useContext(SoundContext);
}
