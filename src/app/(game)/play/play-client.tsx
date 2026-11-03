"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClientGameState,
  computeInGameClock,
  getSeenStoryIds,
  markStoryIdSeen,
} from "@/lib/game/client-utils";
import { sumRoundDurations } from "@/lib/game/admin-utils";
import {
  GameHeader,
  QuestionView,
  Sidebar,
  SidebarMessageItem,
  StoryOverlayData,
  SoundProvider,
  useSound,
  ThemeBackground,
  RoomBackdrop,
  ThemeEffects,
  Round5WaitingRoom,
  WaitingStation,
  FinalBreachGate,
} from "@/components";
import { getThemeForRound, ThemeId } from "@/theme/rounds";
import { getRoundDefinition } from "@/rounds/registry";
import { getSceneConfig } from "@/lib/scenes";
import { SquadLobby } from "@/components/game/SquadLobby";

// Lazy-load the heavy story overlay component
const StoryOverlay = dynamic(
  () => import("@/components/StoryOverlay").then((m) => m.StoryOverlay),
  { ssr: false }
);

function getPendingOverlay(
  gameState: ClientGameState | null,
  dismissedIds: Set<string>
): StoryOverlayData | null {
  if (!gameState || !gameState.unlockedStory) return null;
  if (gameState.gameStatus !== "running" && !gameState.finished) return null;

  const seenInStorage = getSeenStoryIds(gameState.teamId);
  const isSeen = (id: string) => dismissedIds.has(id) || seenInStorage.has(id);

  // a. Check prologue
  if (!isSeen("prologue")) {
    return {
      id: "prologue",
      type: "prologue",
      title: "HOLLOWAY RESEARCH FACILITY — INVESTIGATION BRIEFING",
      narratorText: gameState.unlockedStory.prologue.briefing,
      transitionText: gameState.unlockedStory.prologue.transitionToRound1,
    };
  }

  // b. Check room entrance for current active room
  const currentRoomIdx = Math.min(
    Math.floor(gameState.progress / 4),
    gameState.unlockedStory.rooms.length - 1
  );
  const currentRoom = gameState.unlockedStory.rooms[currentRoomIdx];

  if (currentRoom) {
    const entranceId = `room_${currentRoom.id}_entrance`;
    if (!isSeen(entranceId)) {
      return {
        id: entranceId,
        type: "room_entrance",
        title: `LOCATION: ${currentRoom.location}`,
        narratorText: currentRoom.entranceMessage,
        imageKey: currentRoom.entranceImageKey,
      };
    }
  }

  // c. Check round discoveries for completed rooms
  for (const room of gameState.unlockedStory.rooms) {
    if (gameState.progress >= room.id * 4 && room.discoveryFile) {
      const discId = `room_${room.id}_discovery`;
      if (!isSeen(discId)) {
        return {
          id: discId,
          type: "discovery",
          title: `RECOVERED ARCHIVE: ROOM ${room.id}`,
          bodyText: room.discoveryFile,
          transitionText: room.transitionToNextRoom,
        };
      }
    }
  }

  // d. Final cinematic
  if (gameState.finished && !isSeen("final_cinematic") && gameState.unlockedStory.finalCinematic) {
    return {
      id: "final_cinematic",
      type: "final_cinematic",
      title: "SUBJECT ZERO — FINAL RECONSTRUCTION",
      narratorText: gameState.unlockedStory.finalCinematic.narratorText,
      overlayLines: gameState.unlockedStory.finalCinematic.overlayLines,
    };
  }

  return null;
}

export function PlayClient() {
  const router = useRouter();
  const { play, setRoom, setConnectionStatus, stopAll } = useSound();

  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dismissedOverlayIds, setDismissedOverlayIds] = useState<Set<string>>(() => new Set());
  const [activeClock, setActiveClock] = useState<string>("23:47:16");
  const [liveRoundSeconds, setLiveRoundSeconds] = useState<number | null>(null);
  const [liveUniversalSeconds, setLiveUniversalSeconds] = useState<number | null>(null);
  const [isConnectionLost, setIsConnectionLost] = useState<boolean>(false);

  const clientReceivedTimeRef = useRef<number>(0);
  const failureCountRef = useRef<number>(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch game state from /api/state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });

      if (res.status === 401) {
        router.push("/");
        return;
      }

      if (!res.ok) {
        failureCountRef.current += 1;
        if (failureCountRef.current >= 3) {
          setIsConnectionLost(true);
        }
        return;
      }

      failureCountRef.current = 0;
      setIsConnectionLost(false);
      const data: ClientGameState = await res.json();
      clientReceivedTimeRef.current = Date.now();
      setGameState(data);

      const isFinished = Boolean(
        data.finished ||
        data.allRound5Submitted ||
        (data.round5SubmittedCount ?? 0) >= 4
      );

      // If team has already reached the leaderboard previously, lock them out of /play
      if (isFinished && typeof window !== "undefined") {
        try {
          if (sessionStorage.getItem("squad_investigation_concluded") === "true") {
            router.replace("/leaderboard");
            return;
          }
        } catch {}
      }

      if (typeof data.roundRemainingSeconds === "number") {
        setLiveRoundSeconds(data.roundRemainingSeconds);
      }
      if (data.teamStartedAt) {
        const isFinished = Boolean(
          data.finished ||
          data.allRound5Submitted ||
          (data.round5SubmittedCount ?? 0) >= 4
        );
        if (isFinished && data.roundBreakdown && data.roundBreakdown.length > 0) {
          setLiveUniversalSeconds(sumRoundDurations(data.roundBreakdown));
        } else if (isFinished && data.teamFinishedAt) {
          const total = Math.max(
            0,
            Math.floor(
              (new Date(data.teamFinishedAt).getTime() - new Date(data.teamStartedAt).getTime()) / 1000
            )
          );
          setLiveUniversalSeconds(total);
        } else if (!isFinished) {
          const total = Math.max(
            0,
            Math.floor((Date.now() - new Date(data.teamStartedAt).getTime()) / 1000)
          );
          setLiveUniversalSeconds(total);
        }
      }
    } catch {
      failureCountRef.current += 1;
      if (failureCountRef.current >= 3) {
        setIsConnectionLost(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // 2. State polling with exponential backoff and visibility handling
  useEffect(() => {
    let isMounted = true;

    const schedulePoll = (delayMs: number) => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = setTimeout(async () => {
        if (!isMounted || document.hidden) return;
        await fetchState();
        // Responsive polling interval: 1500ms when waiting in standby so turn swaps swap automatically without page refresh
        const baseInterval =
          gameState?.gameStatus === "running"
            ? !gameState.isMyTurn
              ? 1500
              : 2000
            : 3000;
        const backoffMultiplier = Math.min(4, Math.pow(1.5, failureCountRef.current));
        schedulePoll(baseInterval * backoffMultiplier);
      }, delayMs);
    };

    const initialTimer = setTimeout(() => {
      void schedulePoll(0);
    }, 0);

    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        schedulePoll(0);
      } else if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchState, gameState?.gameStatus, gameState?.isMyTurn]);

  // Game conclusion status (all 4 squad members have completed Round 5, or team finished)
  const isSquadFinished = Boolean(
    gameState?.finished ||
    gameState?.allRound5Submitted ||
    (gameState?.round5SubmittedCount ?? 0) >= 4
  );

  // Audio alert on entering overtime
  const prevOvertimeRef = useRef(false);
  useEffect(() => {
    if (gameState?.isOvertime && !prevOvertimeRef.current && !isSquadFinished) {
      play("wrong");
    }
    prevOvertimeRef.current = Boolean(gameState?.isOvertime);
  }, [gameState?.isOvertime, isSquadFinished, play]);

  // 3. Live in-game clock ticker (ticks every second based on server offset, freezes when squad finishes)
  useEffect(() => {
    if (!gameState) return;

    const tick = () => {
      const clock = computeInGameClock({
        gameStartedAt: gameState.gameStartedAt,
        pausedTotalSeconds: gameState.pausedTotalSeconds,
        serverTime: gameState.serverTime,
        clientReceivedTimeMs: clientReceivedTimeRef.current || Date.now(),
        isPaused: gameState.gameStatus === "paused" || isSquadFinished,
      });
      setActiveClock(clock);
    };

    tick();
    if (gameState.gameStatus === "paused" || isSquadFinished) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameState, isSquadFinished]);

  // 3b. Live Round Countdown ticker (ticks down 10:00 -> 00:00 second by second ONLY when round has started and squad has not finished)
  const isRoundStarted = Boolean(gameState?.roundStarted);
  const isGameRunning = gameState?.gameStatus === "running";
  const hasLiveRound = liveRoundSeconds !== null;

  useEffect(() => {
    if (!isGameRunning || !hasLiveRound || !isRoundStarted || isSquadFinished) return;

    const interval = setInterval(() => {
      setLiveRoundSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 0) return 0;
        if (prev === 1) {
          // Trigger immediate state refresh once when 0 is reached
          void fetchState();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameRunning, hasLiveRound, isRoundStarted, isSquadFinished, fetchState]);

  // 3c. Live Universal Stopwatch ticker (ticks UP 00:00:00 -> ∞, freezes when squad finishes)
  useEffect(() => {
    if (!isGameRunning || !gameState?.teamStartedAt || isSquadFinished) return;

    const interval = setInterval(() => {
      setLiveUniversalSeconds((prev) => (prev === null ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameRunning, gameState?.teamStartedAt, isSquadFinished]);

  // 4. Ambient sound playback & connection degradation sync
  useEffect(() => {
    if (!gameState) return;

    // Check if game is actively running, not finished, and not in lobby
    const isActivelyPlaying =
      gameState.gameStatus === "running" &&
      !gameState.finished &&
      !gameState.inLobby;

    // Sounds play ONLY for the active player of each round (Rounds 1..4), and for ALL in Round 5!
    const currentRound = Math.min(5, Math.floor(gameState.progress / 4) + 1);
    const shouldPlaySound =
      isActivelyPlaying && (currentRound === 5 || Boolean(gameState.isMyTurn));

    if (shouldPlaySound) {
      setRoom(currentRound);
      const currentRoom =
        gameState.unlockedStory?.rooms.find((r) => r.id === currentRound) ??
        gameState.unlockedStory?.rooms[0];
      const status = currentRoom?.connectionStatus ?? "UNSTABLE";
      setConnectionStatus(status);
    } else {
      stopAll();
    }
  }, [gameState, setRoom, setConnectionStatus, stopAll]);

  // Cleanup: ensure all sounds stop when unmounting or navigating away
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  // 5. Screen Wake Lock while game is running
  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    if (gameState?.gameStatus !== "running") return;

    let wakeLock: { release: () => Promise<void> } | null = null;

    const requestWakeLock = async () => {
      try {
        const nav = navigator as unknown as {
          wakeLock?: {
            request: (type: string) => Promise<{ release: () => Promise<void> }>;
          };
        };
        if (nav.wakeLock) {
          wakeLock = await nav.wakeLock.request("screen");
        }
      } catch {
        // Silently handle unsupported browsers / permission rejection
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && gameState?.gameStatus === "running") {
        void requestWakeLock();
      }
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [gameState?.gameStatus]);

  // 6. Preload NEXT room's image once question 3 of current room is solved
  useEffect(() => {
    if (!gameState) return;
    const progress = gameState.progress;
    // (progress % 4 === 3) means 3 questions in current room are solved, on the 4th question
    if (progress % 4 === 3) {
      const currentRoom = Math.floor(progress / 4) + 1;
      const nextKey = currentRoom < 5 ? `round${currentRoom + 1}` : "final";
      const nextScene = getSceneConfig(nextKey);
      if (nextScene?.src && typeof window !== "undefined") {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = nextScene.src;
        document.head.appendChild(link);
        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [gameState]);

  // 7. Derived active story overlay
  const activeOverlay = useMemo(
    () => getPendingOverlay(gameState, dismissedOverlayIds),
    [gameState, dismissedOverlayIds]
  );

  const handleDismissOverlay = () => {
    if (activeOverlay && gameState) {
      markStoryIdSeen(gameState.teamId, activeOverlay.id);
      setDismissedOverlayIds((prev) => new Set(prev).add(activeOverlay.id));
    }
  };

  // 7b. Auto-activate Round Timer when the active operator arrives at the question (not during description reading)
  const startingRoundRef = useRef<boolean>(false);
  useEffect(() => {
    if (
      !gameState ||
      gameState.inLobby ||
      gameState.finished ||
      gameState.gameStatus !== "running" ||
      activeOverlay !== null ||
      gameState.roundStarted ||
      !gameState.isMyTurn
    ) {
      return;
    }

    if (startingRoundRef.current) return;
    startingRoundRef.current = true;

    fetch("/api/round/start", { method: "POST" })
      .then((res) => {
        if (res.ok) {
          void fetchState();
        }
      })
      .catch(() => {})
      .finally(() => {
        startingRoundRef.current = false;
      });
  }, [gameState, activeOverlay, fetchState]);

  // 8. Sidebar messages compilation
  const sidebarMessages = useMemo((): SidebarMessageItem[] => {
    if (!gameState || !gameState.unlockedStory) return [];

    const list: SidebarMessageItem[] = [];
    const seen = getSeenStoryIds(gameState.teamId);

    // Prologue messages
    gameState.unlockedStory.prologue.sidebarMessages.forEach((msg, idx) => {
      list.push({
        id: `prologue_${idx}`,
        rawText: msg,
        timestamp: "23:47:16",
      });
    });

    // Room messages
    gameState.unlockedStory.rooms.forEach((room) => {
      if (seen.has(`room_${room.id}_entrance`)) {
        list.push({
          id: `room_${room.id}_entry`,
          rawText: room.entrySidebarMessage,
          timestamp: "23:48:00",
        });
      }

      if (seen.has(`room_${room.id}_discovery`) && room.afterDiscoverySidebarMessage) {
        list.push({
          id: `room_${room.id}_after_disc`,
          rawText: room.afterDiscoverySidebarMessage,
          timestamp: "23:49:00",
        });
      }
    });

    return list;
  }, [gameState]);

  // 9. Answer Submission Handler
  const handleAnswerSubmit = async (
    answerText: string
  ): Promise<{
    correct: boolean;
    feedback?: string;
    reveal?: string;
    rateLimitSeconds?: number;
    networkError?: boolean;
  }> => {
    if (!gameState?.currentQuestion) {
      return { correct: false, feedback: "NO ACTIVE QUESTION" };
    }

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: gameState.currentQuestion.id,
          answer: answerText,
        }),
      });

      if (res.status === 429) {
        const retryHeader = res.headers.get("Retry-After");
        const seconds = retryHeader ? parseInt(retryHeader, 10) : 60;
        play("wrong");
        return {
          correct: false,
          rateLimitSeconds: seconds,
        };
      }

      if (res.status === 401) {
        router.push("/");
        return { correct: false, feedback: "SESSION EXPIRED" };
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        play("wrong");
        return {
          correct: false,
          feedback: data?.error ?? "SUBMISSION REJECTED",
        };
      }

      const isCorrect = Boolean(data.correct);
      if (isCorrect) {
        play("correct");
      } else {
        play("wrong");
      }

      // If this solved the 20th question (game completed), cut audio immediately
      if (data?.finished) {
        stopAll();
      }

      // Immediately refetch state after submit
      await fetchState();

      return {
        correct: isCorrect,
        feedback: data.feedback,
        reveal: data.reveal,
      };
    } catch {
      play("wrong");
      return {
        correct: false,
        networkError: true,
      };
    }
  };

  const handleAdvanceQuestion = async () => {
    await fetchState();
  };

  const [isAuthorizingGate, setIsAuthorizingGate] = useState<boolean>(false);
  const handleAuthorizeRound5 = async () => {
    if (isAuthorizingGate) return;
    setIsAuthorizingGate(true);
    try {
      const res = await fetch("/api/round5/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        play("correct");
        await fetchState();
      }
    } catch {
      // ignore
    } finally {
      setIsAuthorizingGate(false);
    }
  };

  const handleLeave = async () => {
    try {
      await fetch("/api/leave", { method: "POST" });
    } finally {
      router.push("/");
    }
  };

  const roomNumber = Math.min(5, Math.floor((gameState?.progress ?? 0) / 4) + 1);
  const themeId: ThemeId =
    !gameState || gameState.inLobby || gameState.gameStatus === "waiting"
      ? "lobby"
      : gameState.finished || gameState.gameStatus === "ended"
      ? "round5"
      : (`round${roomNumber}` as ThemeId);
  const currentTheme = getThemeForRound(themeId);
  const roundDef = getRoundDefinition(roomNumber);

  // Loading Screen
  if (isLoading) {
    return (
      <main
        data-round="lobby"
        className="min-h-[100dvh] flex items-center justify-center p-4 bg-background text-text font-mono relative overflow-hidden"
      >
        <ThemeBackground currentThemeId="lobby" />
        <RoomBackdrop backdrop="lobby-fog" />
        <ThemeEffects effects={currentTheme.effects} />
        <div className="relative z-10 flex items-center gap-3 text-xs tracking-widest uppercase text-[var(--accent)]">
          <span className="inline-block w-2.5 h-2.5 bg-[var(--accent)] animate-pulse" />
          <span>CONNECTING TO CONTAINMENT NETWORK...</span>
        </div>
      </main>
    );
  }

  if (!gameState) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4 bg-background text-text font-mono">
        <div className="text-center space-y-3">
          <p className="text-xs text-emergency-red uppercase tracking-widest font-bold">
            TERMINAL CONNECTION FAILED
          </p>
          <p className="text-[11px] text-text/50 max-w-xs mx-auto">
            Team session is disconnected or facility database was reset.
          </p>
          <button
            type="button"
            onClick={handleLeave}
            className="px-4 py-2 border border-panel hover:border-cold-blue text-xs text-text/80 hover:text-cold-blue transition-colors font-mono"
          >
            RETURN TO ACCESS PORTAL
          </button>
        </div>
      </main>
    );
  }

  // State: Squad Lobby (Awaiting all 4 agents)
  if (gameState.inLobby) {
    return (
      <main
        data-round="lobby"
        className="min-h-[100dvh] flex flex-col bg-background text-text font-mono relative overflow-hidden"
      >
        <ThemeBackground currentThemeId="lobby" />
        <RoomBackdrop backdrop="lobby-fog" />
        <ThemeEffects effects={currentTheme.effects} />
        <div className="relative z-10 flex flex-col min-h-screen">
          <GameHeader
            teamName={gameState.teamName}
            inGameClock={activeClock}
            joinCode={gameState.joinCode}
            memberName={gameState.currentMember?.name}
            statusBadge="SQUAD ASSEMBLY"
            onLeave={handleLeave}
          />
          <div className="flex-1 flex items-center justify-center p-4">
            <SquadLobby
              teamName={gameState.teamName}
              joinCode={gameState.joinCode ?? ""}
              currentMember={gameState.currentMember}
              onGameReady={fetchState}
            />
          </div>
        </div>
      </main>
    );
  }

  // State a: Waiting for competition start
  if (gameState.gameStatus === "waiting") {
    return (
      <main className="min-h-[100dvh] flex flex-col bg-background text-text font-mono select-none">
        <GameHeader
          teamName={gameState.teamName}
          joinCode={gameState.joinCode}
          memberName={gameState.currentMember?.name}
          statusBadge="AWAITING START"
          onLeave={handleLeave}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xl border border-panel bg-panel/60 p-8 shadow-2xl text-center space-y-6">
            <div className="text-[10px] text-text/40 tracking-widest uppercase">
              HOLLOWAY RESEARCH FACILITY // NET-OP-01
            </div>
            <div className="flex justify-center">
              <span className="w-3 h-3 bg-cold-blue rounded-full animate-ping inline-block" />
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-widest text-text uppercase">
              AWAITING AUTHORISATION. THE INVESTIGATION HAS NOT BEGUN.
            </h1>
            <p className="text-xs text-text/60 leading-relaxed">
              Team assigned: <span className="text-cold-blue font-bold">{gameState.teamName}</span>
              <br />
              Stand by at your assigned station. The research director will release the emergency lock simultaneously for all units.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href="/leaderboard"
                className="px-4 py-2 border border-panel hover:border-cold-blue text-xs text-text/80 hover:text-cold-blue transition-colors"
              >
                VIEW LEADERBOARD
              </Link>
              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2 border border-panel text-xs text-text/50 hover:text-emergency-red transition-colors"
              >
                DISCONNECT TERMINAL
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // State e: Finished all 20 questions (legacy fallback if no co-op squad roster)
  if (gameState.finished && (!gameState.members || gameState.members.length === 0)) {
    return (
      <main className="min-h-[100dvh] flex flex-col bg-background text-text font-mono select-none">
        <GameHeader
          teamName={gameState.teamName}
          joinCode={gameState.joinCode}
          memberName={gameState.currentMember?.name}
          universalSeconds={liveUniversalSeconds}
          inGameClock={activeClock}
          statusBadge="INVESTIGATION CONCLUDED"
          onLeave={handleLeave}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xl border border-success/40 bg-panel/80 p-8 shadow-2xl text-center space-y-6">
            <div className="text-xs text-success font-bold tracking-widest uppercase">
              INVESTIGATION CONCLUDED
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-widest text-text uppercase">
              SUBJECT ZERO PROTOCOL COMPLETED.
            </h1>
            <div className="space-y-2 py-4 border-y border-panel/60 text-xs text-text/80">
              <div>
                OPERATING UNIT: <span className="text-cold-blue font-bold">{gameState.teamName}</span>
              </div>
              <div>
                TOTAL QUESTIONS SOLVED: <span className="text-success font-bold font-mono">20 / 20</span>
              </div>
              <div>
                STATUS: <span className="text-text font-bold">CONTAINMENT RECORD ARCHIVED</span>
              </div>
            </div>
            <p className="text-xs text-text/70 leading-relaxed">
              All 20 containment protocols have been resolved! Your squad record has been officially registered.
              Click below to view your official finish time, ranking, and position on the leaderboard podium.
            </p>

            {/* ROUND PERFORMANCE BREAKDOWN */}
            {gameState.roundBreakdown && gameState.roundBreakdown.length > 0 && (
              <div className="text-left text-xs bg-background/60 border border-panel/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-panel/50 pb-1.5">
                  <span className="text-[10px] text-text/40 uppercase tracking-widest font-bold">
                    ROUND PERFORMANCE BREAKDOWN
                  </span>
                  {gameState.totalDurationFormatted && (
                    <span className="text-xs text-cold-blue font-bold font-mono">
                      TOTAL TIME: {gameState.totalDurationFormatted}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                  {gameState.roundBreakdown.map((rb) => {
                    const assignedMember = gameState.members?.find((m) => m.assigned_round === rb.round);
                    return (
                      <div key={rb.round} className="p-2 bg-panel/30 border border-panel/50 text-center space-y-0.5">
                        <div className="text-[9px] text-text/50 uppercase font-bold">
                          ROUND {rb.round}
                        </div>
                        <div className="text-xs font-bold text-success">
                          {rb.formattedTime}
                        </div>
                        <div className="text-[9px] text-text/40 truncate">
                          {rb.round === 5 ? "ALL SQUAD" : assignedMember?.name ?? `Agent ${rb.round}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {gameState.members && gameState.members.length > 0 && (
              <div className="text-left text-xs bg-background/60 border border-panel/60 p-3.5 space-y-1">
                <span className="text-[10px] text-text/40 uppercase tracking-widest block mb-1.5 font-bold">
                  OPERATIONAL SQUAD UNITS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {gameState.members.map((m) => (
                    <div key={m.id} className="truncate flex items-center gap-1.5">
                      <span className="text-cold-blue font-bold">ROUND {m.assigned_round}:</span>
                      <span className="text-text/90 font-medium">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/leaderboard"
                className="px-6 py-2.5 bg-cold-blue text-background hover:bg-cold-blue/90 text-xs font-bold uppercase tracking-widest transition-colors shadow-lg"
              >
                🏆 VIEW LEADERBOARD RANKINGS
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // State d: Ended by research director
  if (gameState.gameStatus === "ended") {
    return (
      <main className="min-h-[100dvh] flex flex-col bg-background text-text font-mono select-none">
        <GameHeader
          teamName={gameState.teamName}
          joinCode={gameState.joinCode}
          memberName={gameState.currentMember?.name}
          inGameClock={activeClock}
          statusBadge="TEST CONCLUDED"
          onLeave={handleLeave}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xl border border-emergency-red/50 bg-panel/80 p-8 shadow-2xl text-center space-y-6">
            <div className="text-xs text-emergency-red uppercase font-bold tracking-widest">
              TERMINAL DISCONNECTED
            </div>
            <h1 className="text-base font-bold tracking-widest text-text uppercase">
              INVESTIGATION CLOSED BY THE RESEARCH DIRECTOR.
            </h1>
            <p className="text-xs text-text/60">
              Team: {gameState.teamName} · Solved: {gameState.progress} / 20 questions
            </p>
            <div className="pt-4">
              <Link
                href="/leaderboard"
                className="px-6 py-2 border border-panel text-xs text-text/70 hover:text-text"
              >
                VIEW FINAL STANDINGS
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // State b & c: Running (with optional Paused overlay)
  const questionNumber = (gameState.progress % 4) + 1;
  const currentRoom =
    gameState.unlockedStory?.rooms.find((r) => r.id === roomNumber) ??
    gameState.unlockedStory?.rooms[0];
  const connectionStatus =
    currentRoom?.connectionStatus ?? "UNSTABLE";

  const isRound5Waiting =
    roomNumber === 5 &&
    (Boolean(gameState.round5Submitted) ||
      Boolean(gameState.finished) ||
      Boolean(gameState.allRound5Submitted));

  const isFinalBreachGate =
    roomNumber === 5 &&
    !gameState.round5Authorized &&
    !gameState.finished;

  const isStandbyWaitingStation =
    roomNumber < 5 &&
    gameState.isMyTurn === false &&
    !gameState.finished;

  return (
    <div
      data-round={currentTheme.id}
      className="min-h-[100dvh] flex flex-col bg-background text-text font-mono relative overflow-hidden"
    >
      <ThemeBackground currentThemeId={currentTheme.id} />
      <RoomBackdrop backdrop={currentTheme.backdrop} />
      <ThemeEffects effects={currentTheme.effects} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header */}
        <GameHeader
          teamName={gameState.teamName}
          inGameClock={activeClock}
          joinCode={gameState.joinCode}
          memberName={gameState.currentMember?.name}
          roundRemainingSeconds={liveRoundSeconds ?? gameState.roundRemainingSeconds}
          roundStarted={gameState.roundStarted}
          universalSeconds={liveUniversalSeconds}
          isMyTurn={gameState.isMyTurn ?? true}
          activeOperatorName={gameState.activeOperator?.name}
          currentRound={gameState.currentRound ?? 1}
          roomNumber={roomNumber}
          questionNumber={questionNumber}
          isSquadFinished={isSquadFinished}
          statusBadge={isSquadFinished ? "SUBJECT ZERO CONTAINED" : undefined}
          isOvertime={gameState.isOvertime}
          overtimeSeconds={gameState.overtimeSeconds}
          roundEffectiveBudgetSeconds={gameState.roundEffectiveBudgetSeconds}
          roundIncomingDebtSeconds={gameState.roundIncomingDebtSeconds}
          onLeave={handleLeave}
        />



      {/* Non-blocking Connection Lost Amber Banner */}
      {isConnectionLost && (
        <div
          role="status"
          aria-live="polite"
          className="w-full bg-amber-950/90 border-b border-amber-500/80 text-amber-300 text-xs font-mono py-2 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-2 select-none z-40 sticky top-0"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          CONNECTION LOST. YOUR PROGRESS IS SAVED. RETRYING…
        </div>
      )}

      {/* Main Game Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Terminal Left Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex items-center justify-center">
          {isStandbyWaitingStation ? (
            <WaitingStation
              teamName={gameState.teamName}
              activeOperatorName={gameState.activeOperator?.name}
              activeRound={gameState.currentRound ?? 1}
              roundRemainingSeconds={liveRoundSeconds ?? gameState.roundRemainingSeconds}
              roundStarted={gameState.roundStarted}
              members={gameState.members || []}
              currentMemberId={gameState.currentMember?.id}
              recoveredAnswers={gameState.recoveredAnswers || []}
              locationName={currentRoom?.location}
              isOvertime={gameState.isOvertime}
              overtimeSeconds={gameState.overtimeSeconds}
              roundEffectiveBudgetSeconds={gameState.roundEffectiveBudgetSeconds}
              roundIncomingDebtSeconds={gameState.roundIncomingDebtSeconds}
            />
          ) : isFinalBreachGate ? (
            <FinalBreachGate
              teamName={gameState.teamName}
              members={gameState.members || []}
              currentMemberId={gameState.currentMember?.id}
              readyMemberIds={gameState.round5ReadyMemberIds || []}
              onAuthorize={handleAuthorizeRound5}
              isAuthorizing={isAuthorizingGate}
            />
          ) : isRound5Waiting ? (
            <Round5WaitingRoom
              teamName={gameState.teamName}
              members={gameState.members || []}
              currentMemberId={gameState.currentMember?.id}
              round5SubmittedCount={gameState.round5SubmittedCount ?? 0}
              allSubmitted={Boolean(
                gameState.finished ||
                gameState.allRound5Submitted ||
                (gameState.round5SubmittedCount ?? 0) >= 4
              )}
              totalDurationFormatted={gameState.totalDurationFormatted}
              roundBreakdown={gameState.roundBreakdown}
            />
          ) : gameState.currentQuestion ? (
            <QuestionView
              key={gameState.currentQuestion.id}
              question={gameState.currentQuestion}
              roundDef={roundDef}
              serverProgress={gameState.progress}
              caseFile={gameState.isMyTurn ? gameState.caseFile : undefined}
              isMyTurn={gameState.isMyTurn ?? true}
              activeOperatorName={gameState.activeOperator?.name}
              currentRound={gameState.currentRound ?? 1}
              round5Objective={gameState.round5Objective}
              round5SubmittedCount={gameState.round5SubmittedCount}
              canEndGame={gameState.canEndGame}
              onAnswerSubmit={handleAnswerSubmit}
              onAdvanceQuestion={handleAdvanceQuestion}
              onExecuteEndGame={() => {
                stopAll();
                fetchState();
              }}
            />
          ) : (
            <div className="text-center p-8 text-xs text-text/40 tracking-widest uppercase">
              [NO ACTIVE TERMINAL INPUT]
            </div>
          )}
        </main>

        {/* Right Sidebar (Desktop panel & mobile drawer) */}
        <Sidebar
          connectionStatus={connectionStatus}
          messages={sidebarMessages}
          currentClock={activeClock}
        />
      </div>

      {/* Paused State Overlay */}
      {gameState.gameStatus === "paused" && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm select-none"
        >
          <div className="w-full max-w-md border border-emergency-red/60 bg-panel p-8 shadow-2xl text-center space-y-4">
            <span className="w-2.5 h-2.5 bg-emergency-red rounded-full animate-ping inline-block" />
            <h2 className="text-sm font-bold text-emergency-red tracking-widest uppercase">
              INVESTIGATION SUSPENDED. STAND BY.
            </h2>
            <p className="text-xs text-text/60 leading-relaxed">
              All terminal inputs have been locked by the facility controller. Network synchronization remains active.
            </p>
          </div>
        </div>
      )}

      {/* Full-Screen Story Overlay (Prologue, Room Entrance, Discovery, Final Cinematic) */}
      {activeOverlay && (
        <StoryOverlay
          data={activeOverlay}
          onDismiss={handleDismissOverlay}
        />
      )}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <SoundProvider>
      <PlayClient />
    </SoundProvider>
  );
}
