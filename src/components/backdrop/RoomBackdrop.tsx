"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { BackdropType } from "@/theme/rounds";

const LazyCrtGrid = lazy(() => import("./CrtGrid"));
const LazyDataRain = lazy(() => import("./DataRain"));
const LazyPulseCore = lazy(() => import("./PulseCore"));
const LazyDossierDust = lazy(() => import("./DossierDust"));
const LazyEmergencyPulse = lazy(() => import("./EmergencyPulse"));
const LazyLobbyFog = lazy(() => import("./LobbyFog"));

interface RoomBackdropProps {
  backdrop: BackdropType;
  reducedMotion?: boolean;
}

export function RoomBackdrop({ backdrop, reducedMotion = false }: RoomBackdropProps) {
  const [isTabHidden, setIsTabHidden] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const renderBackdropVariant = () => {
    switch (backdrop) {
      case "crt-grid":
        return <LazyCrtGrid />;
      case "data-rain":
        return <LazyDataRain />;
      case "pulse-core":
        return <LazyPulseCore />;
      case "dossier-dust":
        return <LazyDossierDust />;
      case "emergency-pulse":
        return <LazyEmergencyPulse />;
      case "lobby-fog":
      default:
        return <LazyLobbyFog />;
    }
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none theme-backdrop ${
        isTabHidden ? "theme-anim-paused" : ""
      } ${reducedMotion ? "theme-reduced-motion" : ""}`}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        {renderBackdropVariant()}
      </Suspense>
    </div>
  );
}

export default RoomBackdrop;
