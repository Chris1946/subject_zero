# SUBJECT ZERO — INVENTED / ADAPTED TEXT REGISTER

This document tracks all intentional deviations, adaptations, and newly authored text compared to the original Implementation Guide in `/docs`, submitted for review and approval.

---

### Round 1: Monitoring Station

#### Question 1.1 Prompt Adaptation (The Blinking Signal)

**Original Implementation Guide Text:**
> "TERMINAL 01: PROJECT IDENTIFICATION The monitoring terminal contains a binary sequence. The project database requires the sequence to be converted into ASCII text before its records can be accessed. Decode the following: 01010011 01011010 Enter the two-letter project identifier."

**New Replacement Sentence (when interactive tools are enabled):**
> "An optical indicator on the terminal display flashes the binary sequence (a long flash represents 1, a short flash represents 0); transcribe the transmission and convert the signal into ASCII characters."

**Full Adapted Prompt for Question 1.1 (Interactive Mode):**
> "TERMINAL 01: PROJECT IDENTIFICATION The monitoring terminal contains a binary sequence. The project database requires the sequence to be converted into ASCII text before its records can be accessed. An optical indicator on the terminal display flashes the binary sequence (a long flash represents 1, a short flash represents 0); transcribe the transmission and convert the signal into ASCII characters. Enter the two-letter project identifier."

**Fallback / Plain Text Prompt (Reduced Motion or Kill Switch Activated):**
> "TERMINAL 01: PROJECT IDENTIFICATION The monitoring terminal contains a binary sequence. The project database requires the sequence to be converted into ASCII text before its records can be accessed. Decode the following: 01010011 01011010 Enter the two-letter project identifier."

**Reason for Invention:**
Replaces the static printed binary sequence with an atmospheric optical signal lamp transmission that players transcribe using the 16-bit toggle decoder, while strictly maintaining the original binary sequence, answer verification ("SZ"), rate limits, and an instantaneous non-flashing accessibility fallback.

---

### Photosensitivity and Flashing Rate Documentation

- **Flash durations:** Long pulse = 700 ms (bit 1), Short pulse = 250 ms (bit 0).
- **Intra-byte gap:** 480 ms darkness between flashes.
- **Inter-byte gap:** 1300 ms darkness between byte 1 and byte 2.
- **Maximum Flash Frequency:** $\approx 1.37\text{ flashes/sec}$ maximum ($1 / (0.25\text{s} + 0.48\text{s})$), strictly lower than the WCAG 2.3.1 safety limit of $\le 3\text{ flashes/sec}$.
- **Accessibility Safeguards:**
  - `prefers-reduced-motion` automatically reveals the plaintext binary sequence without flashing.
  - "SHOW PATTERN AS TEXT" button is visible at all times, has zero penalty/cooldown, and immediately displays `01010011 01011010`.
  - Admin tools kill-switch disables the signal lamp globally and returns the original plaintext prompt.
