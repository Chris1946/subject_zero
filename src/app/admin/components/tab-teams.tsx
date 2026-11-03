"use client";

import { useState } from "react";
import { isTeamStalled, isTeamBruteForcing, formatDurationMmSs } from "@/lib/game/admin-utils";

export interface AdminSquadMember {
  id: string;
  member_index: number;
  name: string;
  email: string;
  is_connected: boolean;
  assigned_round: number;
  round5_submitted: boolean;
}

export interface AdminTeamRecord {
  id: string;
  name: string;
  join_code: string;
  progress: number;
  attempts: number;
  started_at: string | null;
  finished_at: string | null;
  disqualified: boolean;
  created_at: string;
  last_attempt_at: string | null;
  current_question_wrong_attempts: number;
  lobby_ready?: boolean;
  members?: AdminSquadMember[];
}

interface TabTeamsProps {
  teams: AdminTeamRecord[];
  gameStatus: string;
  serverTime?: string;
  onRefresh: () => Promise<void>;
}

export function TabTeams({ teams, gameStatus, serverTime, onRefresh }: TabTeamsProps) {
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 4-Member Squad Creation State (Open by default so it is immediately visible!)
  const [showCreateModal, setShowCreateModal] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdSquadInfo, setCreatedSquadInfo] = useState<{
    teamName: string;
    joinCode: string;
  } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const nowMs = serverTime ? new Date(serverTime).getTime() : 0;

  function handleMemberChange(idx: number, field: "name" | "email", val: string) {
    setMembers((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  }

  async function handleCreateSquad(e: React.FormEvent) {
    e.preventDefault();
    if (isCreating) return;

    if (!teamName.trim()) {
      setCreateError("Squad/Team name is required");
      return;
    }

    for (let i = 0; i < 4; i++) {
      if (!members[i].name.trim() || !members[i].email.trim()) {
        setCreateError(`Please provide Name and Email for all 4 members (missing Member ${i + 1})`);
        return;
      }
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/admin/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamName.trim(),
          members: members.map((m) => ({
            name: m.name.trim(),
            email: m.email.trim().toLowerCase(),
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCreateError(data?.error || data?.details || "Failed to create squad");
        return;
      }

      setCreatedSquadInfo({
        teamName: data.team?.name || teamName.trim(),
        joinCode: data.team?.joinCode || "",
      });

      // Clear form inputs
      setTeamName("");
      setMembers([
        { name: "", email: "" },
        { name: "", email: "" },
        { name: "", email: "" },
        { name: "", email: "" },
      ]);

      await onRefresh();
    } catch {
      setCreateError("Network error while creating squad");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCopyInviteText(code: string, name: string) {
    if (typeof window === "undefined") return;
    const invite = `Subject Zero // Squad: ${name}\nJoin Code: ${code}\nLink: ${window.location.origin}/?code=${code}`;
    try {
      await navigator.clipboard.writeText(invite);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    } catch {
      // Fallback
    }
  }

  function getTeamDuration(t: AdminTeamRecord): number | null {
    if (t.started_at && t.finished_at) {
      return Math.max(
        0,
        Math.floor((new Date(t.finished_at).getTime() - new Date(t.started_at).getTime()) / 1000)
      );
    }
    return null;
  }

  // Sort teams strictly:
  const sortedTeams = [...teams].sort((a, b) => {
    const aFinished = a.finished_at !== null || a.progress >= 20;
    const bFinished = b.finished_at !== null || b.progress >= 20;

    if (aFinished && !bFinished) return -1;
    if (!aFinished && bFinished) return 1;

    if (aFinished && bFinished) {
      const durA = getTeamDuration(a) ?? Infinity;
      const durB = getTeamDuration(b) ?? Infinity;
      if (durA !== durB) return durA - durB;
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      const timeA = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const timeB = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return timeA - timeB;
    }

    if (b.progress !== a.progress) return b.progress - a.progress;
    return a.attempts - b.attempts;
  });

  // Calculate rank for finished teams
  let rankCounter = 0;
  const teamRanks = new Map<string, number>();
  for (const t of sortedTeams) {
    if (t.finished_at !== null || t.progress >= 20) {
      rankCounter++;
      teamRanks.set(t.id, rankCounter);
    }
  }

  // Filtered teams list
  const filteredTeams = sortedTeams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDeleteTeam(teamId: string, name: string) {
    if (!window.confirm(`Are you sure you want to permanently delete squad "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, action: "delete" }),
      });
      if (res.ok) {
        await onRefresh();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to delete team");
      }
    } catch {
      alert("Network error while deleting team");
    }
  }

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Top Banner & Creator Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse inline-block" />
            SQUAD ROSTER & TEAM MANAGEMENT
          </h2>
          <span className="text-xs text-white/50 block mt-0.5">
            TOTAL TEAMS REGISTERED: <strong className="text-cyan-400">{teams.length}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(!showCreateModal)}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
            showCreateModal
              ? "bg-slate-800 text-white border border-white/30 hover:bg-slate-700"
              : "bg-cyan-400 text-black hover:bg-cyan-300 font-extrabold"
          }`}
        >
          {showCreateModal ? "✕ HIDE SQUAD GENERATOR" : "⚡ + GENERATE NEW SQUAD (4 MEMBERS + CODE)"}
        </button>
      </div>

      {/* SQUAD CREATED SUCCESS BANNER */}
      {createdSquadInfo && (
        <div className="p-4 border-2 border-emerald-500 bg-emerald-950/60 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-emerald-300 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              <span>✓</span>
              <span>SQUAD REGISTERED: {createdSquadInfo.teamName}</span>
            </span>
            <button
              type="button"
              onClick={() => setCreatedSquadInfo(null)}
              className="text-white/40 hover:text-white text-base px-2"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="px-4 py-2 bg-black border-2 border-cyan-400 font-bold text-cyan-300 tracking-[0.25em] text-base">
              CODE: {createdSquadInfo.joinCode}
            </div>
            <button
              type="button"
              onClick={() => handleCopyInviteText(createdSquadInfo.joinCode, createdSquadInfo.teamName)}
              className="px-4 py-2 bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              {inviteCopied ? "INVITE COPIED ✓" : "COPY SQUAD CODE & INVITE"}
            </button>
            <span className="text-emerald-200/70 text-xs">
              Give this 6-character code to the team. They enter it on the homepage to start immediately!
            </span>
          </div>
        </div>
      )}

      {/* SQUAD GENERATION FORM (4 MEMBERS + SQUAD NAME + CODE GENERATION) */}
      {showCreateModal && (
        <form onSubmit={handleCreateSquad} className="p-5 border border-cyan-500/50 bg-slate-900/90 space-y-5 shadow-2xl">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
                OPERATIVE REGISTRATION GATEWAY
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                REGISTER SQUAD (TEAM NAME + 4 MEMBERS) → GENERATE ACCESS CODE
              </h3>
            </div>
            <span className="text-xs bg-cyan-950 border border-cyan-400 text-cyan-300 px-2.5 py-1 font-bold uppercase">
              4 OPERATIVES PER SQUAD
            </span>
          </div>

          {/* Squad Name */}
          <div>
            <label className="text-xs text-white/80 uppercase block mb-1 font-bold">
              1. SQUAD / TEAM NAME:
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. ALPHA SQUAD / ZERO HUNTERS"
              className="w-full max-w-md bg-black border border-white/20 px-3 py-2 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* 4 Member Cards */}
          <div>
            <label className="text-xs text-white/80 uppercase block mb-2 font-bold">
              2. SQUAD MEMBERS (NAME & EMAIL FOR ALL 4 AGENTS):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((member, idx) => (
                <div key={idx} className="p-3 bg-black/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] border-b border-white/10 pb-1 font-bold">
                    <span className="text-cyan-400">OPERATIVE {idx + 1}</span>
                    <span className="text-white/40 text-[10px]">ASSIGNED: ROUND {idx + 1}</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                      placeholder={`Agent ${idx + 1} Full Name`}
                      className="w-full bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      value={member.email}
                      onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                      placeholder={`Agent ${idx + 1} Email`}
                      className="w-full bg-slate-900 border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {createError && (
            <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/60 p-3 uppercase tracking-wider font-bold">
              ⚠ {createError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg cursor-pointer"
            >
              {isCreating ? "GENERATING CODE & REGISTERING..." : "⚡ REGISTER SQUAD & GENERATE CODE"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-white/20 text-xs text-white/60 hover:text-white uppercase transition-colors"
            >
              CLOSE
            </button>
          </div>
        </form>
      )}

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="FILTER TEAMS BY NAME..."
          className="bg-black border border-white/20 px-3 py-1.5 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-cyan-400 w-64"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs text-white/50 hover:text-white uppercase font-mono"
          >
            [CLEAR]
          </button>
        )}
      </div>

      {/* Teams Table */}
      <div className="border border-white/10 bg-slate-900/60 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950 text-white/50 text-[11px] tracking-wider uppercase">
              <th className="py-2.5 px-3 w-16 text-center">RANK</th>
              <th className="py-2.5 px-3">TEAM / SQUAD NAME & 4 AGENTS</th>
              <th className="py-2.5 px-3">JOIN CODE</th>
              <th className="py-2.5 px-3">PROGRESS</th>
              <th className="py-2.5 px-3 text-center">ATTEMPTS</th>
              <th className="py-2.5 px-3 text-right">TOTAL TIME</th>
              <th className="py-2.5 px-3">LAST ACTIVITY</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 font-mono">
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-white/40 tracking-wider">
                  NO TEAMS MATCHING SELECTION CRITERIA.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => {
                const stalled = isTeamStalled(team.last_attempt_at, gameStatus, nowMs);
                const bruteForcing = isTeamBruteForcing(team.current_question_wrong_attempts);
                const isFinished = team.finished_at !== null || team.progress >= 20;
                const rank = teamRanks.get(team.id);

                let rankBadge = "—";
                let rankBadgeClass = "text-white/40";
                if (rank === 1) {
                  rankBadge = "🥇 #1";
                  rankBadgeClass = "text-amber-300 font-bold bg-amber-950/20 px-1.5 py-0.5 border border-amber-400/40";
                } else if (rank === 2) {
                  rankBadge = "🥈 #2";
                  rankBadgeClass = "text-slate-200 font-bold bg-slate-900/40 px-1.5 py-0.5 border border-slate-400/40";
                } else if (rank === 3) {
                  rankBadge = "🥉 #3";
                  rankBadgeClass = "text-amber-600 font-bold bg-amber-950/20 px-1.5 py-0.5 border border-amber-700/40";
                } else if (rank) {
                  rankBadge = `#${rank}`;
                  rankBadgeClass = "text-cyan-400 font-bold";
                }

                // Row Highlighting:
                let rowHighlightClass = "hover:bg-slate-850";
                if (isFinished) {
                  rowHighlightClass = "bg-emerald-950/20 border-l-2 border-l-emerald-500 hover:bg-emerald-950/30";
                } else if (bruteForcing) {
                  rowHighlightClass = "bg-rose-950/30 border-l-4 border-l-rose-500 hover:bg-rose-950/40";
                } else if (stalled) {
                  rowHighlightClass = "bg-amber-950/20 border-l-4 border-l-amber-500/80 hover:bg-amber-950/30";
                }

                // Compute team status badge
                let statusLabel = "WAITING";
                let statusBadgeClass = "border-white/20 text-white/50";

                if (isFinished) {
                  statusLabel = "FINISHED";
                  statusBadgeClass = "border-emerald-500 text-emerald-400 bg-emerald-950/40";
                } else if (team.started_at !== null || team.attempts > 0) {
                  statusLabel = "IN PROGRESS";
                  statusBadgeClass = "border-cyan-400 text-cyan-300 bg-cyan-950/40";
                }

                const roomNum = Math.min(5, Math.floor(team.progress / 4) + 1);
                const progressText = isFinished
                  ? "Concluded · 20/20"
                  : `Room ${roomNum} · ${team.progress}/20`;

                // Total duration formatting
                let totalTimeDisplay = "—";
                if (isFinished && team.started_at && team.finished_at) {
                  const dur = Math.max(
                    0,
                    Math.floor(
                      (new Date(team.finished_at).getTime() - new Date(team.started_at).getTime()) /
                        1000
                    )
                  );
                  totalTimeDisplay = formatDurationMmSs(dur);
                } else if (team.started_at && !isFinished) {
                  const elapsed = Math.max(
                    0,
                    Math.floor((nowMs - new Date(team.started_at).getTime()) / 1000)
                  );
                  totalTimeDisplay = `${formatDurationMmSs(elapsed)} [LIVE]`;
                }

                return (
                  <tr key={team.id} className={`transition-colors ${rowHighlightClass}`}>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block ${rankBadgeClass}`}>{rankBadge}</span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="text-sm font-bold text-white">{team.name}</div>
                      {/* Render 4 squad members with round badges */}
                      {team.members && team.members.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-mono font-normal">
                          {team.members.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1.5 bg-black/80 px-2 py-0.5 border border-white/10"
                              title={m.email}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.is_connected ? "bg-emerald-400" : "bg-amber-400/60"
                                }`}
                              />
                              <span className="font-semibold text-white/90">{m.name}</span>
                              <span className="text-cyan-400 font-bold">
                                [R{m.assigned_round || m.member_index}]
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                      {bruteForcing && (
                        <span className="mt-1 text-[10px] text-rose-400 uppercase tracking-wider block font-normal">
                          [WARNING: {team.current_question_wrong_attempts} WRONG ATTEMPTS ON CURRENT Q]
                        </span>
                      )}
                      {stalled && !bruteForcing && (
                        <span className="mt-1 text-[10px] text-amber-400 uppercase tracking-wider block font-normal">
                          [STALLED: &gt;5 MIN INACTIVE]
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold tracking-widest text-cyan-300 bg-black px-2 py-1 border border-cyan-500/60 text-xs">
                          {team.join_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(team.join_code)}
                          className="px-2 py-1 border border-white/20 text-[10px] text-white/80 hover:text-white hover:border-cyan-400 transition-colors bg-white/5 cursor-pointer font-bold"
                          title="Copy join code"
                        >
                          {copiedCode === team.join_code ? "COPIED ✓" : "COPY"}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-white/80 whitespace-nowrap">
                      {progressText}
                    </td>

                    <td className="py-3 px-3 text-center text-white/70 whitespace-nowrap">
                      {team.attempts}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span className={isFinished ? "text-cyan-400 text-sm" : "text-white/70 text-xs"}>
                        {totalTimeDisplay}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-white/50 whitespace-nowrap">
                      {team.last_attempt_at
                        ? new Date(team.last_attempt_at).toLocaleTimeString()
                        : "No activity"}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="px-2 py-1 border border-red-500/40 text-[10px] text-red-400 hover:bg-red-500/20 hover:text-red-300 uppercase tracking-wider font-bold transition-colors cursor-pointer"
                        title={`Delete squad ${team.name}`}
                      >
                        [✕ DELETE]
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
