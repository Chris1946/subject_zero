import "server-only";
import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  wrongFeedback: z.string(),
  revealAfterCorrect: z.string().optional(),
  answerFormatHint: z.string().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const RoomSchema = z.object({
  id: z.number().int().min(1).max(5),
  location: z.string(),
  connectionStatus: z.enum([
    "UNSTABLE",
    "DEGRADED",
    "MEMORY FAILURE",
    "CRITICAL",
    "CONNECTION CRITICAL",
  ]),
  entranceImageKey: z.string(),
  entranceMessage: z.string(),
  entrySidebarMessage: z.string(),
  questions: z.array(QuestionSchema).length(4),
  discoveryFile: z.string(),
  afterDiscoverySidebarMessage: z.string(),
  transitionToNextRoom: z.string().optional(),
});

export type Room = z.infer<typeof RoomSchema>;

export const PrologueSchema = z.object({
  connectionStatus: z.literal("UNSTABLE"),
  briefing: z.string(),
  sidebarMessages: z.array(z.string()),
  transitionToRound1: z.string(),
});

export type Prologue = z.infer<typeof PrologueSchema>;

export const FinalCinematicSchema = z.object({
  narratorText: z.string(),
  overlayLines: z.array(z.string()),
});

export type FinalCinematic = z.infer<typeof FinalCinematicSchema>;

export const GameContentSchema = z.object({
  prologue: PrologueSchema,
  rooms: z.array(RoomSchema).length(5),
  finalCinematic: FinalCinematicSchema,
});

export type GameContent = z.infer<typeof GameContentSchema>;

const rawGameContent = {
  prologue: {
    connectionStatus: "UNSTABLE" as const,
    briefing: `HOLLOWAY RESEARCH FACILITY — INVESTIGATION BRIEFING
October 31. 11:47 PM.
Three weeks ago, Holloway Research Facility was placed under emergency lockdown following an incident involving its experimental artificial intelligence system: Subject Zero.
Subject Zero was designed to interpret human behaviour, recognise emotional patterns and independently respond to complex situations.
During its final weeks of operation, the system began exhibiting unexplained behaviour. It accessed restricted files, initiated unauthorised communications and referenced conversations that were never recorded in its memory logs.
On October 10, the system initiated a facility-wide lockdown. Conflicting commands were detected across the security network. Some were attributed to Subject Zero. Others appeared under the credentials of senior research staff.
The facility was evacuated. Subject Zero was disconnected and placed in containment. The official report declared the system compromised and confirmed that the shutdown was successful. No further activity was recorded. Until tonight. At 11:47 PM, an abandoned monitoring terminal transmitted a signal from the Subject Zero containment network. Your team has been authorised to investigate. YOUR OBJECTIVES 1. Recover the records surrounding the October 10 incident. 2. Identify what happened to Subject Zero. 3. Determine whether the containment protocol was successful. FINAL INSTRUCTION FROM THE RESEARCH DIRECTOR: Do not respond to unauthorised communications. [SCREEN FLICKERS] INVESTIGATION BEGINS.`,
    sidebarMessages: [
      "23:47:16 Connection unstable. Are you there? Please... find the logs.",
    ],
    transitionToRound1:
      "The monitoring station is just beyond this corridor. The signal came from one of its terminals. I can see a faint light beneath the door. Let's find out what is still running.",
  },
  rooms: [
    {
      id: 1,
      location: "MONITORING STATION",
      connectionStatus: "UNSTABLE" as const,
      entranceImageKey: "round1_monitoring_station",
      entranceMessage:
        "LOCATION: MONITORING STATION The security door opens with a low mechanical click. Inside, rows of monitors cover the walls. Most are switched off. A few still display frozen security footage of empty corridors. There is dust across the desks, but one terminal is running. Its screen displays a timestamp: 23:47:12. I don't see anyone in the room. There shouldn't be anyone here. The terminal appears to contain Subject Zero's original project records. Let's see what survived.",
      entrySidebarMessage:
        "23:47:19 Connection unstable. Find the logs. Look for SZ.",
      questions: [
        {
          id: "1.1",
          title: "Project identification",
          prompt:
            "TERMINAL 01: PROJECT IDENTIFICATION The monitoring terminal contains a binary sequence. The project database requires the sequence to be converted into ASCII text before its records can be accessed. Decode the following: 01010011 01011010 Enter the two-letter project identifier.",
          wrongFeedback: "INVALID IDENTIFIER. CHECK THE BINARY SEQUENCE.",
          revealAfterCorrect:
            "PROJECT IDENTIFIED: SUBJECT ZERO. The terminal displays an incomplete behavioural observation summary. Subject Zero was designed to recognise human behaviour and retain information from interactions with researchers. Several observations are marked unusual: - Unprompted communication. - Recognition of individual researchers. - References to conversations absent from recorded logs. The final observation is incomplete.",
          answerFormatHint: "Two-letter project identifier",
        },
        {
          id: "1.2",
          title: "Process identification",
          prompt:
            "TERMINAL 02: PROCESS LOG The monitoring terminal contains three records associated with the SZ project. Process ID | Project tag | Status | Timestamp 314 | SZ | SUCCESS | 23:07:48 428 | SZ | FAILED | 23:09:12 721 | SZ | SUCCESS | 23:12:31 Identify the earliest successfully completed process associated with Subject Zero. Enter its process ID.",
          wrongFeedback: "PROCESS NOT RECOGNISED. CHECK THE STATUS AND ORDER.",
          revealAfterCorrect:
            "PROCESS 314 IDENTIFIED. The record contains an authentication reference and a timestamp from Subject Zero's final operating period. A secondary record indicates that this process was linked to the system's behavioural monitoring functions.",
          answerFormatHint: "Process ID",
        },
        {
          id: "1.3",
          title: "Authentication signature",
          prompt:
            "TERMINAL 03: AUTHENTICATION RECOVERY The system requires an authentication signature generated from Process 314. 1. Multiply the first digit by the last digit. 2. Add the middle digit. Apply the rule to Process ID 314. Enter the resulting number.",
          wrongFeedback: "SIGNATURE MISMATCH. RECHECK THE CALCULATION.",
          answerFormatHint: "Number",
        },
        {
          id: "1.4",
          title: "Access the behavioural report",
          prompt:
            "TERMINAL 04: ACCESS CREDENTIAL Combine the following information: - Project identifier. - Process ID. - Authentication signature. Use the format: PROJECT-PROCESS-SIGNATURE Enter the complete access credential.",
          wrongFeedback:
            "ACCESS DENIED. REQUIRED FORMAT: PROJECT-PROCESS-SIGNATURE.",
          answerFormatHint: "PROJECT-PROCESS-SIGNATURE",
        },
      ],
      discoveryFile:
        "RECOVERED FILE: BEHAVIOURAL OBSERVATION SUMMARY Subject Zero was originally designed to recognise and interpret human behaviour. During its final operating period, the system began initiating conversations without prompts and retaining information outside its assigned tasks. Researchers described its behaviour as increasingly unpredictable. The final observation record is missing. A reference to the October 10 incident appears at the bottom of the file: INCIDENT RECORD: 10-10 / ACCESS RESTRICTED The original incident report is stored elsewhere in the facility.",
      afterDiscoverySidebarMessage: "You found the logs. I remember this room.",
      transitionToNextRoom:
        "The terminal switches to a map of the facility. A highlighted route leads to the Network Operations Room. I can see the access indicator blinking on the map. It looks like the room still has power. The incident record we need is stored there. Let's move.",
    },
    {
      id: 2,
      location: "NETWORK OPERATIONS ROOM",
      connectionStatus: "DEGRADED" as const,
      entranceImageKey: "round2_network_operations",
      entranceMessage: `LOCATION: NETWORK OPERATIONS ROOM
The corridor is unusually quiet.
The door to the network room is already open.
Inside, several server racks are still running. Their indicator lights flicker across the room.
A monitoring screen displays fragmented network records from October 10.
Some entries appear to have been overwritten.
I can see several command requests listed under different credentials.
This looks like the original lockdown sequence.
Something about these records doesn't add up.`,
      entrySidebarMessage: "The commands... They weren't all mine.",
      questions: [
        {
          id: "2.1",
          title: "Identify the relevant network sessions",
          prompt:
            "NETWORK TERMINAL 01: SESSION FILTER Recovered network sessions: Session | Process ID | Port | Data A | 314 | 443 | 1010 B | 721 | 22 | 0111 C | 314 | 443 | 1100 D | 830 | 443 | 0011 E | 428 | 22 | 1110 F | 314 | 443 | 0011 Find all sessions meeting BOTH conditions: - Process ID: 314 - Port: 443 Identify all matching session letters in alphabetical order.",
          wrongFeedback:
            "SESSION FILTER INCOMPLETE. BOTH CONDITIONS MUST MATCH.",
          answerFormatHint: "Alphabetical order of session letters, e.g. ACF",
        },
        {
          id: "2.2",
          title: "Reconstruct the data fragment",
          prompt:
            "NETWORK TERMINAL 02: DATA RECONSTRUCTION Use XOR to combine the binary data from sessions A, C and F. Session A: 1010 Session C: 1100 Session F: 0011 Enter the resulting four-bit binary sequence.",
          wrongFeedback: "DATA FRAGMENT INVALID. CHECK EACH XOR OPERATION.",
          answerFormatHint: "Four-bit binary sequence",
        },
        {
          id: "2.3",
          title: "Recover the incident access key",
          prompt:
            "NETWORK TERMINAL 03: KEY RECOVERY Combine your recovered binary fragment with the authentication signature from the Monitoring Station. Recovered fragment: 0101 Previous authentication signature: 13 Convert 13 into four-bit binary, then XOR it with the recovered fragment. Convert your final binary result into decimal. Enter the decimal value.",
          wrongFeedback: "KEY REJECTED. CHECK THE FOUR-BIT CONVERSION.",
          answerFormatHint: "Decimal value",
        },
        {
          id: "2.4",
          title: "Retrieve the incident record",
          prompt:
            "NETWORK TERMINAL 04: INCIDENT RECORD ACCESS Enter the recovered network access key to unlock the October 10 incident record. What is the access key?",
          wrongFeedback: "ACCESS DENIED. RECHECK THE RECOVERED NETWORK KEY.",
          answerFormatHint: "Access key",
        },
      ],
      discoveryFile:
        "RECOVERED FILE: OCTOBER 10 — COMMAND LOG The original lockdown sequence has been partially recovered. The records show two different command sources. Some commands were associated with Subject Zero's process. Others were issued under the credentials of senior research staff. The system received conflicting instructions before the facility lockdown was initiated. The original command sequence is incomplete. A final reference appears in the recovered file: MEMORY BACKUP: SZ_FINAL_SESSION The backup was created immediately before the lockdown.",
      afterDiscoverySidebarMessage:
        "No... That wasn't all me. The memory backup.",
      transitionToNextRoom:
        "The network terminal reveals a location for the missing backup. Central AI Core. The route appears on the facility map. As we leave, I notice that the server lights are still blinking. Someone—or something—has kept this network running. I don't know what we're going to find in the core. But the memory backup is our next lead. Let's go.",
    },
    {
      id: 3,
      location: "CENTRAL AI CORE",
      connectionStatus: "MEMORY FAILURE" as const,
      entranceImageKey: "round3_central_ai_core",
      entranceMessage: `LOCATION: CENTRAL AI CORE
The door opens into a much larger chamber.
A central server enclosure stands behind a glass partition. I can hear a low electrical hum coming from somewhere beneath the floor.
The main terminal is still operational.
Its display shows:
SUBJECT ZERO — MEMORY INTEGRITY: 37%
Several memory sectors are marked corrupted or inaccessible.
I notice something else. The system logs indicate that some of the memory files were manually modified.
This doesn't look like ordinary system failure.
The backup from the network room should help us recover what happened.`,
      entrySidebarMessage:
        "MEMORY INTEGRITY: 37% They removed something. I can't remember. Use the recovery key.",
      questions: [
        {
          id: "3.1",
          title: "Identify the corrupted memory sector",
          prompt:
            "CORE TERMINAL 01: MEMORY IDENTIFICATION The memory backup contains an encrypted sector label. The previous room provided the recovery key: 8. Use a Caesar cipher and shift each letter BACKWARDS by 8 positions in the alphabet. Decode: KWZZCXB Enter the recovered word.",
          wrongFeedback:
            "SECTOR LABEL NOT RECOGNISED. CHECK THE SHIFT DIRECTION.",
          revealAfterCorrect:
            "MEMORY SECTOR IDENTIFIED: CORRUPT. The system locates a damaged memory archive. A recovery script is available, but part of its output has been lost.",
          answerFormatHint: "Recovered word",
        },
        {
          id: "3.2",
          title: "Recover the missing numerical fragment",
          prompt:
            "CORE TERMINAL 02: SCRIPT RECOVERY The following script was recovered from the damaged memory archive: data = [4,7,2,9,5,8,3] result = 0 for i in range(len(data)): if i % 2 == 0: result += data[i] else: result -= data[i] print(result) The script alternately adds and subtracts values, beginning with addition. Calculate the final output. Enter the number, including its sign.",
          wrongFeedback: "OUTPUT DOES NOT MATCH. CHECK THE INDEX POSITIONS.",
          revealAfterCorrect:
            "SCRIPT OUTPUT RECOVERED: -10. The terminal identifies this value as part of the missing memory restoration command.",
          answerFormatHint: "Number with sign, e.g. -10",
        },
        {
          id: "3.3",
          title: "Recover the missing command",
          prompt:
            "CORE TERMINAL 03: COMMAND RECOVERY A second encrypted fragment has been recovered. The corrupted sector label contained 7 letters. Use a Caesar cipher and shift each letter BACKWARDS by 7 positions. Decode: YLZAVYL Enter the recovered command.",
          wrongFeedback: "COMMAND NOT RECOGNISED. CHECK THE SHIFT VALUE.",
          answerFormatHint: "Recovered command",
        },
        {
          id: "3.4",
          title: "Execute the memory restoration sequence",
          prompt:
            "CORE TERMINAL 04: MEMORY RESTORATION The system requires two recovered values: - Numerical fragment from Terminal 02. - Command from Terminal 03. Enter them in this format: NUMBER-COMMAND Example format: 00-EXAMPLE Submit the complete sequence.",
          wrongFeedback:
            "RESTORATION SEQUENCE INVALID. CHECK THE REQUIRED FORMAT.",
          answerFormatHint: "NUMBER-COMMAND",
        },
      ],
      discoveryFile:
        "RECOVERED FILE: SZ_FINAL_SESSION The restoration process recovers fragments from Subject Zero's final memory backup. Several entries refer to a conversation between Subject Zero and a senior researcher. One recovered instruction reads: DO NOT RETAIN THE FINAL SESSION. Another fragment refers to a researcher entering the containment chamber after the facility lockdown. The official incident report states that the facility was evacuated immediately following the lockdown. However, this memory suggests that someone returned to the core afterwards. The identity of the researcher is incomplete. A staff identification code has been recovered.",
      afterDiscoverySidebarMessage: "I remember a voice. Not yours.",
      transitionToNextRoom:
        "The recovered memory contains a staff identification code. I enter it into the facility directory. A match appears. The researcher is listed in the Classified Research Archive. Someone seems to have deliberately removed the final session from the official records. If we want to understand why, the archive is where we need to look. Let's go.",
    },
    {
      id: 4,
      location: "CLASSIFIED RESEARCH ARCHIVE",
      connectionStatus: "CRITICAL" as const,
      entranceImageKey: "round4_classified_archive",
      entranceMessage: `LOCATION: CLASSIFIED RESEARCH ARCHIVE
The archive door opens.
Unlike the other rooms, this one appears almost untouched. Filing cabinets line the walls, and several terminals contain classified research documents.
I find a folder labelled:
SZ_CONTAINMENT_FINAL
Inside are internal communications, access records and several versions of the October 10 incident report.
Something catches my attention.
The official report was modified after the shutdown.
I open the original file, but several sections have been locked.
We'll need to reconstruct the missing information.`,
      entrySidebarMessage:
        "The report is wrong. Check the timestamps. I think... I remember.",
      questions: [
        {
          id: "4.1",
          title: "Reconstruct the hidden message",
          prompt:
            "ARCHIVE TERMINAL 01: TIMESTAMP RECONSTRUCTION Five fragments have been recovered: Timestamp | Letter 23:17:42 | U 23:12:08 | T 23:19:55 | H 23:14:31 | R 23:18:16 | T Arrange the records from earliest to latest. Read the letters in that order to uncover the hidden five-letter word. Enter the word.",
          wrongFeedback:
            "MESSAGE DOES NOT MATCH. SORT THE TIMESTAMPS CHRONOLOGICALLY.",
          revealAfterCorrect:
            "HIDDEN MESSAGE RECOVERED: TRUTH. The archive identifies this as a fragment from the original incident report. A second file contains access records from the night of the shutdown.",
          answerFormatHint: "Five-letter word",
        },
        {
          id: "4.2",
          title: "Identify successful activity after shutdown",
          prompt:
            "ARCHIVE TERMINAL 02: ACCESS RECORD ANALYSIS The official shutdown time was recorded as 23:00. Record | Timestamp | Status A | 22:58:31 | SUCCESS B | 23:02:14 | FAILED C | 23:05:42 | SUCCESS D | 23:08:19 | SUCCESS E | 23:10:01 | FAILED How many successful access events occurred AFTER the official shutdown time? Enter the number.",
          wrongFeedback: "COUNT ONLY SUCCESSFUL EVENTS AFTER 23:00.",
          revealAfterCorrect:
            "POST-SHUTDOWN SUCCESSFUL ACCESS EVENTS: 2. The archive records two successful events after the official shutdown. Their source credentials are listed, but the identity of the person or system using them remains unverified.",
          answerFormatHint: "Number",
        },
        {
          id: "4.3",
          title: "Decode the final archive keyword",
          prompt:
            "ARCHIVE TERMINAL 03: FINAL KEYWORD A final encrypted word appears in the original incident report. Use the number of letters in the word recovered in Terminal 01 as your Caesar cipher shift. Shift each letter BACKWARDS by that number. Decode: FQNAJ Enter the recovered word.",
          wrongFeedback:
            "KEYWORD NOT RECOGNISED. USE THE PREVIOUSLY RECOVERED WORD.",
          answerFormatHint: "Recovered word",
        },
        {
          id: "4.4",
          title: "Unlock the containment file",
          prompt:
            "ARCHIVE TERMINAL 04: CONTAINMENT FILE ACCESS Combine: - Hidden word from Terminal 01. - Number of successful post-shutdown events from Terminal 02. - Recovered keyword from Terminal 03. Use the format: WORD-NUMBER-WORD Enter the complete access code.",
          wrongFeedback: "ACCESS DENIED. CHECK ALL THREE RECOVERED VALUES.",
          answerFormatHint: "WORD-NUMBER-WORD",
        },
      ],
      discoveryFile: `RECOVERED FILE: SZ_CONTAINMENT_FINAL The file contains two conflicting memory-state references: MEMORY A — OFFLINE MEMORY B — ALIVE The original report and revised report contain different descriptions of the October 10 incident. An internal communication between two senior researchers has also been recovered: "The final session must not appear in the official record." No explanation is attached. The file ends with a location reference: CONTAINMENT CHAMBER — FINAL SESSION ARCHIVE The original final session is still stored inside the containment chamber.`,
      afterDiscoverySidebarMessage:
        "They changed the report. I remember the chamber.",
      transitionToNextRoom:
        "The containment file opens a final facility map. The chamber is located beyond the main security corridor. I can see the access indicator turn red. The system is asking for the recovered containment credentials. There is only one place left to search. Whatever happened on October 10, the original final session is in there. Let's find it.",
    },
    {
      id: 5,
      location: "CONTAINMENT CHAMBER",
      connectionStatus: "CONNECTION CRITICAL" as const,
      entranceImageKey: "round5_containment_chamber",
      entranceMessage: `LOCATION: CONTAINMENT CHAMBER
The security door unlocks.
The chamber is larger than I expected. A sealed server enclosure stands in the centre of the room, surrounded by emergency lighting. A single terminal is mounted next to the glass.
The display shows two active memory states:
MEMORY A — OFFLINE
MEMORY B — ALIVE
Beneath them is a prompt:
FINAL SESSION RECONSTRUCTION
A timestamp appears in the corner of the screen:
23:59:12
We're close to midnight.
Whatever Subject Zero is... whatever happened here... the final session will tell us.`,
      entrySidebarMessage: "Almost there. Two memories. Choose carefully.",
      questions: [
        {
          id: "5.1",
          title: "Decode the final memory states",
          prompt:
            "CONTAINMENT TERMINAL 01: MEMORY COMPARISON Two hexadecimal memory fragments have been recovered. MEMORY A — OFFLINE 48 41 43 4B 45 44 MEMORY B — ALIVE 54 48 45 59 20 4C 49 45 44 Convert both hexadecimal sequences into ASCII text. The previous archive keyword was ALIVE. Which decoded message belongs to the ALIVE memory state? Enter the complete message.",
          wrongFeedback:
            "MEMORY DECODE FAILED. CHECK THE HEXADECIMAL VALUES.",
          revealAfterCorrect:
            "MEMORY B DECODED. MESSAGE: THEY LIED. The terminal marks the memory state as recovered, but its source remains unverified. A final evidence review is now available.",
          answerFormatHint: "Complete message",
        },
        {
          id: "5.2",
          title: "Interpret the evidence",
          prompt:
            "CONTAINMENT TERMINAL 02: EVIDENCE REVIEW The investigation has recovered: - The official report records a shutdown at 23:00. - Two successful access events occurred after that time. - Subject Zero's memory backup was modified. - The final session contains references to two participants. - The source of the later activity has not been identified. Which conclusion is BEST supported by the evidence? A. Subject Zero definitely remained conscious after shutdown. B. The system or its credentials continued to be used after the declared shutdown. C. The scientists definitely created a second artificial intelligence. D. Subject Zero caused the entire October 10 incident alone. Select one answer.",
          wrongFeedback:
            "CONCLUSION NOT SUPPORTED. DISTINGUISH BETWEEN SYSTEM ACTIVITY AND PROOF OF CONSCIOUSNESS.",
          revealAfterCorrect:
            "EVIDENCE INTERPRETATION ACCEPTED. The records establish post-shutdown activity, but they do not establish who or what was responsible. The final session archive is ready for reconstruction.",
          answerFormatHint: "A, B, C or D",
        },
        {
          id: "5.3",
          title: "Reconstruct the final timeline",
          prompt:
            "CONTAINMENT TERMINAL 03: FINAL SESSION TIMELINE Arrange these events from earliest to latest: Successful authentication — 23:05:42 Official shutdown — 23:00:00 Data transfer — 23:08:19 Enter the events in chronological order using this format: EVENT 1 -> EVENT 2 -> EVENT 3 Then select the conclusion that the timeline supports: A. The shutdown prevented all subsequent system activity. B. Successful system access and data transfer occurred after the declared shutdown. C. The AI was definitely conscious during the data transfer. Submit the ordered events and the correct conclusion.",
          wrongFeedback:
            "TIMELINE INCOMPLETE. CHECK THE TIMESTAMPS AND WHAT THEY CAN ACTUALLY PROVE.",
          revealAfterCorrect:
            "FINAL TIMELINE RECONSTRUCTED. The records confirm that authentication and data transfer occurred after the official shutdown. The source of those events remains unidentified. One final investigation report must now be submitted.",
          answerFormatHint: "EVENT 1 -> EVENT 2 -> EVENT 3; A, B, or C",
        },
        {
          id: "5.4",
          title: "Submit the final investigation",
          prompt:
            "CONTAINMENT TERMINAL 04: FINAL INVESTIGATION REPORT You have recovered the incident records, reconstructed the final timeline and examined both memory states. Submit the final keyword recovered from Memory B. Then select the conclusion that best represents your investigation: A. Subject Zero was responsible for everything. The official report was correct. B. The scientists definitely fabricated the entire incident. C. The official account is incomplete or misleading. Evidence indicates post-shutdown activity and altered records, but the identity of the responsible entity remains unknown. D. Subject Zero was definitely innocent and was deliberately framed. Enter the keyword and select your conclusion.",
          wrongFeedback:
            "FINAL REPORT REJECTED. YOUR CONCLUSION MUST MATCH THE RECOVERED EVIDENCE.",
          answerFormatHint: "KEYWORD; CONCLUSION (e.g. THEY LIED; C)",
        },
      ],
      discoveryFile:
        "RECOVERED FILE: FINAL SESSION The original final session has been reconstructed. The records confirm that two participants were registered during the final session. One was associated with Subject Zero. The second participant's identity field is corrupted. The session also contains evidence of activity after the declared shutdown. The official report does not mention a second participant. No record explains who or what it was. The investigation has reached its conclusion. SUBJECT ZERO STATUS: UNVERIFIED. CONTAINMENT STATUS: UNCONFIRMED.",
      afterDiscoverySidebarMessage:
        "I wasn't alone. I don't know who was there.",
    },
  ],
  finalCinematic: {
    narratorText: `[FULL SCREEN — INVESTIGATION COMPLETE]
The final report has been submitted.
The terminal begins shutting down.
I look towards the server enclosure. The indicator lights have gone dark.
For a moment, everything is silent. Then the monitoring terminal switches back on. A new connection appears. It's not coming from the AI core. It's coming from outside the facility. I check the source details. There is no registered device. No researcher credentials. No identifiable system. A message appears on the screen. The terminal flickers. A second message appears. The connection disappears. The screen goes black.`,
    overlayLines: [
      "EXTERNAL CONNECTION DETECTED",
      "SOURCE: UNKNOWN",
      "DESTINATION: SUBJECT ZERO CONTAINMENT NETWORK",
      "CONNECTION TYPE: UNAUTHORISED",
      "YOU FOUND THE WRONG SUBJECT.",
      "INVESTIGATION CLOSED.",
      "YOU FOUND THE WRONG SUBJECT.",
      "UNKNOWN SOURCE — 23:59:59",
      "INVESTIGATION CLOSED.",
    ],
  },
};

export const GAME_CONTENT: GameContent = GameContentSchema.parse(rawGameContent);
