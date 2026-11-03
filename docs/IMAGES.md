# SUBJECT ZERO // SCENE IMAGES DIRECTORY & SPECIFICATION

This document outlines the 7 required atmospheric scene images for SUBJECT ZERO, their target specifications, artistic guidelines, source attribution, and licence tracking.

---

## 1. Technical Specifications

- **Format**: WebP (`.webp`)
- **Desktop Dimensions**: `1600 x 900 px` (16:9 aspect ratio)
- **Desktop Max File Size**: `< 250 KB` per file
- **Mobile Dimensions**: `800 x 450 px` (16:9 aspect ratio)
- **Mobile Max File Size**: `< 100 KB` per file
- **Location**: `public/scenes/<key>.webp` and `public/scenes/<key>-mobile.webp`
- **Validation Script**: `npm run check:images`

---

## 2. Visual Direction Guidelines (Strict)

- **Color Palette**: Dark charcoal/black backgrounds (`#0a0b0e`), cold blue/grey atmospheric lighting (`#1a2332`, `#0d1b2a`), occasional emergency red (`#c0392b`, `#8a1818`), muted terminal green (`#4ade80`).
- **Texture & Lighting**: Very subtle CRT scanlines, faint lens vignette, high-contrast shadows, industrial architectural geometry.
- **PROHIBITED CONTENT**:
  - NO cartoon Halloween graphics (pumpkins, bats, cobwebs, ghosts).
  - NO gore, blood splatters, or body horror.
  - NO neon futuristic/cyberpunk UI elements.
  - **CRITICAL**: The **final** image must **NOT** show a face, monster, silhouette of a creature, or identifiable living entity. The horror derives exclusively from empty corridors, cold machinery, log files, and the eerie certainty of being observed.

---

## 3. Scene Inventory & Descriptions

### Scene 1: `prologue`
- **Key**: `prologue`
- **Desktop File**: `public/scenes/prologue.webp`
- **Mobile File**: `public/scenes/prologue-mobile.webp`
- **Guide Description**:
  > "Show the exterior or entrance corridor of Holloway Research Facility at night. The facility should appear sealed and abandoned. An underground research facility at night. Institutional architecture, security doors, dim emergency lighting. No visible creatures."
- **Alt Text**: "Exterior entrance corridor of the underground Holloway Research Facility at night with heavy sealed security doors and dim emergency lighting"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

### Scene 2: `round1`
- **Key**: `round1` (Alias: `round1_monitoring_station`)
- **Desktop File**: `public/scenes/round1.webp`
- **Mobile File**: `public/scenes/round1-mobile.webp`
- **Guide Description**:
  > "Abandoned security monitoring room. Multiple CCTV screens, frozen empty corridor footage, dusty desks and one active terminal."
- **Alt Text**: "Abandoned security monitoring room with dusty desks, rows of dark CCTV screens showing frozen corridors, and one active glowing terminal"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

### Scene 3: `round2`
- **Key**: `round2` (Alias: `round2_network_operations`)
- **Desktop File**: `public/scenes/round2.webp`
- **Mobile File**: `public/scenes/round2-mobile.webp`
- **Guide Description**:
  > "A dark network operations room with server racks, blinking lights, network consoles and fragmented logs on monitors."
- **Alt Text**: "Dark network operations room with towering server racks, blinking indicator LEDs, network consoles, and fragmented logs displayed across monitors"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

### Scene 4: `round3`
- **Key**: `round3` (Alias: `round3_central_ai_core`)
- **Desktop File**: `public/scenes/round3.webp`
- **Mobile File**: `public/scenes/round3-mobile.webp`
- **Guide Description**:
  > "A large central AI chamber with a server enclosure behind glass, blue lighting, dark industrial architecture and a prominent memory-integrity display."
- **Alt Text**: "Large central AI chamber with a server enclosure behind reinforced glass, cold blue industrial lighting, and a prominent memory integrity status display"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

### Scene 5: `round4`
- **Key**: `round4` (Alias: `round4_classified_archive`)
- **Desktop File**: `public/scenes/round4.webp`
- **Mobile File**: `public/scenes/round4-mobile.webp`
- **Guide Description**:
  > "A quiet classified archive with filing cabinets, labelled folders, old terminals and printed documents. A folder labelled SZ_CONTAINMENT_FINAL should be visible."
- **Alt Text**: "Quiet classified research archive with metal filing cabinets, labelled document folders including SZ_CONTAINMENT_FINAL, old CRT terminals, and printed incident records"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

### Scene 6: `round5`
- **Key**: `round5` (Alias: `round5_containment_chamber`)
- **Desktop File**: `public/scenes/round5.webp`
- **Mobile File**: `public/scenes/round5-mobile.webp`
- **Guide Description**:
  > "A sealed AI containment chamber with a central server enclosure, emergency lighting and a terminal. The terminal should visibly show: MEMORY A — OFFLINE, MEMORY B — ACTIVE."
- **Alt Text**: "Sealed AI containment chamber with a central server enclosure surrounded by amber emergency lighting and a terminal displaying memory state divergence"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

### Scene 7: `final`
- **Key**: `final` (Alias: `final_cinematic`)
- **Desktop File**: `public/scenes/final.webp`
- **Mobile File**: `public/scenes/final-mobile.webp`
- **Guide Description**:
  > "A nearly black terminal screen. Minimal red system text. An external connection alert appears. Do not show a monster, face or identifiable entity."
- **Alt Text**: "Nearly black terminal screen with minimal emergency red system diagnostic text and an active external connection alert; no face or entity visible"
- **Source**: Procedural procedural atmospheric shader asset / Tech Team Scenecraft
- **Licence**: MIT / Proprietary for Subject Zero Competition

---

## 4. Verification Checklist

- [x] All 7 keys exist in `public/scenes/<key>.webp`
- [x] All 7 mobile variants exist in `public/scenes/<key>-mobile.webp`
- [x] All desktop images are under 250 KB
- [x] All mobile images are under 100 KB
- [x] Next.js `<Image>` component includes automatic graceful fallback if a file is missing
- [x] Visual scanline overlay and cold vignette applied via CSS
- [x] Zoom animation disabled under `prefers-reduced-motion`
- [x] Overlay text contrast $\ge 4.5:1$ guaranteed by backdrop gradient
