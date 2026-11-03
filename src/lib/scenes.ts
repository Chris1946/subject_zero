export interface SceneConfig {
  key: string;
  src: string;
  mobileSrc?: string;
  alt: string;
  title: string;
  credit?: string;
}

export const SCENES: Record<string, SceneConfig> = {
  prologue: {
    key: "prologue",
    src: "/scenes/prologue.webp",
    mobileSrc: "/scenes/prologue-mobile.webp",
    title: "HOLLOWAY RESEARCH FACILITY // ENTRANCE CORRIDOR",
    alt: "Exterior entrance corridor of the underground Holloway Research Facility at night with heavy sealed security doors and dim emergency lighting",
    credit: "Subject Zero Investigation Archive",
  },
  round1: {
    key: "round1",
    src: "/scenes/round1.webp",
    mobileSrc: "/scenes/round1-mobile.webp",
    title: "LOCATION: MONITORING STATION",
    alt: "Abandoned security monitoring room with dusty desks, rows of dark CCTV screens showing frozen corridors, and one active glowing terminal",
    credit: "Subject Zero Investigation Archive",
  },
  round2: {
    key: "round2",
    src: "/scenes/round2.webp",
    mobileSrc: "/scenes/round2-mobile.webp",
    title: "LOCATION: NETWORK OPERATIONS ROOM",
    alt: "Dark network operations room with towering server racks, blinking indicator LEDs, network consoles, and fragmented logs displayed across monitors",
    credit: "Subject Zero Investigation Archive",
  },
  round3: {
    key: "round3",
    src: "/scenes/round3.webp",
    mobileSrc: "/scenes/round3-mobile.webp",
    title: "LOCATION: CENTRAL AI CORE",
    alt: "Large central AI chamber with a server enclosure behind reinforced glass, cold blue industrial lighting, and a prominent memory integrity status display",
    credit: "Subject Zero Investigation Archive",
  },
  round4: {
    key: "round4",
    src: "/scenes/round4.webp",
    mobileSrc: "/scenes/round4-mobile.webp",
    title: "LOCATION: CLASSIFIED RESEARCH ARCHIVE",
    alt: "Quiet classified research archive with metal filing cabinets, labelled document folders including SZ_CONTAINMENT_FINAL, old CRT terminals, and printed incident records",
    credit: "Subject Zero Investigation Archive",
  },
  round5: {
    key: "round5",
    src: "/scenes/round5.webp",
    mobileSrc: "/scenes/round5-mobile.webp",
    title: "LOCATION: CONTAINMENT CHAMBER",
    alt: "Sealed AI containment chamber with a central server enclosure surrounded by amber emergency lighting and a terminal displaying memory state divergence",
    credit: "Subject Zero Investigation Archive",
  },
  final: {
    key: "final",
    src: "/scenes/final.webp",
    mobileSrc: "/scenes/final-mobile.webp",
    title: "EXTERNAL CONNECTION // TERMINAL DISCONNECT",
    alt: "Nearly black terminal screen with minimal emergency red system diagnostic text and an active external connection alert; no face or entity visible",
    credit: "Subject Zero Investigation Archive",
  },
};

// Map content.server.ts entranceImageKeys to canonical scene keys
export const SCENE_KEY_ALIASES: Record<string, string> = {
  prologue: "prologue",
  round1: "round1",
  round1_monitoring_station: "round1",
  round2: "round2",
  round2_network_operations: "round2",
  round3: "round3",
  round3_central_ai_core: "round3",
  round4: "round4",
  round4_classified_archive: "round4",
  round5: "round5",
  round5_containment_chamber: "round5",
  final: "final",
  final_cinematic: "final",
};

/**
 * Resolves a scene configuration from any recognized scene key or alias.
 */
export function getSceneConfig(keyOrAlias?: string | null): SceneConfig | null {
  if (!keyOrAlias) return null;
  const canonicalKey = SCENE_KEY_ALIASES[keyOrAlias] || keyOrAlias;
  return SCENES[canonicalKey] ?? null;
}
