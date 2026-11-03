"use client";

import React, { useState, useEffect, useRef } from "react";
import { SignalIndicator } from "./SignalIndicator";
import { degradeMessageText } from "@/lib/game/client-utils";
import { useSound } from "./SoundProvider";

export interface SidebarMessageItem {
  id: string;
  rawText: string;
  timestamp: string;
  isNew?: boolean;
}

interface SidebarProps {
  connectionStatus: string;
  messages: SidebarMessageItem[];
  currentClock: string;
}

export function Sidebar({ connectionStatus, messages, currentClock }: SidebarProps) {
  const { play } = useSound();
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [readCount, setReadCount] = useState<number>(0);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const unreadCount = Math.max(0, messages.length - readCount);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingMessageId]);

  // Handle typing indicator and sound for newly arrived message asynchronously
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (latest.isNew) {
        const typingDuration = Math.min(3000, Math.max(1200, latest.rawText.length * 30));
        const startTimer = setTimeout(() => {
          setTypingMessageId(latest.id);
        }, 0);

        const finishTimer = setTimeout(() => {
          setTypingMessageId(null);
          play("message");
        }, typingDuration);

        return () => {
          clearTimeout(startTimer);
          clearTimeout(finishTimer);
        };
      }
    }
  }, [messages, play]);

  const toggleMobileDrawer = () => {
    setIsOpenMobile((prev) => {
      if (!prev) {
        setReadCount(messages.length);
      }
      return !prev;
    });
  };

  return (
    <>
      {/* Mobile Drawer Toggle Button (fixed at bottom right) */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={toggleMobileDrawer}
          className={`flex items-center gap-2 px-4 py-2.5 bg-[#080b11] border ${
            unreadCount > 0
              ? "border-[var(--accent)] text-[var(--accent)] animate-pulse shadow-lg"
              : "border-[var(--panel-border)] text-[#e8f4ff]/80"
          } font-mono text-xs uppercase tracking-widest focus-visible:outline-2 focus-visible:outline-[var(--accent)]`}
          style={{
            boxShadow: unreadCount > 0 ? "0 0 12px var(--accent)" : "none",
          }}
        >
          <span>TERMINAL COMM</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-[var(--accent)] text-[#080b11] font-bold text-[10px] rounded-xs">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Sidebar (Desktop fixed panel; Mobile sliding drawer) */}
      {/* CONSTANT IDENTITY: Ice-white text on dark panel (#080b11); only border & glow pick up round accent */}
      <aside
        className={`fixed lg:static top-0 right-0 h-full w-full sm:w-[360px] lg:w-[340px] border-l border-[var(--accent)]/50 bg-[#080b11]/95 text-[#e8f4ff] backdrop-blur-md flex flex-col z-40 transition-transform duration-300 ${
          isOpenMobile ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
        style={{
          boxShadow: "inset 1px 0 0 var(--accent), -2px 0 var(--theme-glow-radius, 12px) rgba(0, 0, 0, 0.4)",
        }}
        aria-label="Subject Zero terminal communications"
      >
        {/* Constant Header */}
        <div className="p-4 border-b border-[var(--accent)]/30 bg-[#04060a]/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#e8f4ff]/60 tracking-widest uppercase font-mono font-semibold">
              SOURCE: UNKNOWN / UNVERIFIED
            </span>
            <div className="flex items-center gap-2">
              <SignalIndicator status={connectionStatus} />
              {/* Close button on mobile */}
              <button
                type="button"
                onClick={() => setIsOpenMobile(false)}
                className="lg:hidden text-[#e8f4ff]/60 hover:text-[#e8f4ff] px-1 text-xs"
                aria-label="Close communication drawer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#e8f4ff] tracking-widest font-bold">
              STATUS: {connectionStatus}
            </span>
            <span className="text-[#e8f4ff]/60 text-[10px] tabular-nums tracking-widest">
              {currentClock}
            </span>
          </div>
        </div>

        {/* Messages List - Ice-white text on dark background */}
        <div
          ref={scrollRef}
          aria-live="polite"
          className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs"
        >
          {messages.length === 0 && !typingMessageId ? (
            <div className="text-[#e8f4ff]/40 italic text-center py-8 tracking-wider">
              [NO ACTIVE TRANSMISSION]
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentlyTyping = typingMessageId === msg.id;
              if (isCurrentlyTyping) {
                return (
                  <div
                    key={msg.id}
                    className="border-l-2 border-[var(--accent)]/70 pl-3 py-1 text-[#e8f4ff]/70"
                  >
                    <span className="text-[10px] text-[#e8f4ff]/50 block mb-1">
                      {msg.timestamp || currentClock}
                    </span>
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] animate-bounce rounded-full" />
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] animate-bounce delay-100 rounded-full" />
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] animate-bounce delay-200 rounded-full" />
                    </span>
                  </div>
                );
              }

              const degraded = degradeMessageText(msg.rawText, connectionStatus, index * 7);

              return (
                <div
                  key={msg.id}
                  className="border-l-2 border-[var(--accent)] pl-3 py-1 space-y-1 bg-[#0f1420]/60 rounded-r-xs p-2 transition-colors duration-200"
                >
                  <span className="text-[10px] text-[var(--accent)] tracking-wider block font-semibold">
                    {msg.timestamp}
                  </span>
                  <p className="text-[#e8f4ff] leading-relaxed whitespace-pre-wrap select-text font-normal">
                    {degraded}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-[var(--accent)]/20 text-[10px] text-[#e8f4ff]/40 tracking-widest uppercase font-mono text-center bg-[#04060a]/40">
          SECURE CHANNEL // UNMONITORED
        </div>
      </aside>
    </>
  );
}
