"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminTeamRecord } from "./tab-teams";

export interface AttemptEntry {
  id: number;
  teamId: string;
  teamName: string;
  questionId: string;
  answerGiven: string;
  isCorrect: boolean;
  createdAt: string;
}

interface TeamSummary {
  firstAttemptTime: string | null;
  lastAttemptTime: string | null;
  countWrong: number;
  countCorrect: number;
}

interface TabAttemptsProps {
  teams: AdminTeamRecord[];
}

export function TabAttempts({ teams }: TabAttemptsProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async (teamId?: string, before?: string) => {
    const isPaging = Boolean(before);
    if (isPaging) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (teamId) params.set("teamId", teamId);
      if (before) params.set("before", before);

      const res = await fetch(`/api/admin/attempts?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (isPaging) {
        setAttempts((prev) => [...prev, ...(data.attempts || [])]);
      } else {
        setAttempts(data.attempts || []);
      }
      setNextCursor(data.nextCursor || null);
      setTeamSummary(data.teamSummary || null);
    } catch {
      setError("Failed to retrieve attempt logs from server");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch when selected team changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAttempts(selectedTeamId || undefined);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedTeamId, fetchAttempts]);

  // Compute per-question attempt counts when filtered to a single team
  const questionAttemptCounts: Record<string, number> = {};
  if (selectedTeamId) {
    attempts.forEach((a) => {
      questionAttemptCounts[a.questionId] =
        (questionAttemptCounts[a.questionId] || 0) + 1;
    });
  }

  function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    fetchAttempts(selectedTeamId || undefined, nextCursor);
  }

  return (
    <div className="space-y-6">
      {/* Controls: Team Filter Dropdown & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-border bg-panel/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="team-filter" className="text-xs text-text/60 uppercase font-mono">
            FILTER BY TEAM:
          </label>
          <select
            id="team-filter"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-background border border-border px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-emergency-red"
          >
            <option value="">-- ALL TEAMS --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => fetchAttempts(selectedTeamId || undefined)}
          disabled={loading}
          className="px-3 py-1.5 border border-border text-xs text-text/70 hover:text-text hover:border-primary uppercase tracking-wider font-mono disabled:opacity-40"
        >
          {loading ? "FETCHING..." : "REFRESH LOGS"}
        </button>
      </div>

      {/* Selected Team Summary Metrics */}
      {selectedTeamId && (
        <div className="border border-border/70 bg-panel/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <h3 className="text-xs uppercase font-bold text-text tracking-wider">
              INVESTIGATION DISPUTE BREAKDOWN:{" "}
              <span className="text-primary font-mono">
                {teams.find((t) => t.id === selectedTeamId)?.name}
              </span>
            </h3>
            {teamSummary && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-success">
                  CORRECT: <strong>{teamSummary.countCorrect}</strong>
                </span>
                <span className="text-emergency-red">
                  WRONG: <strong>{teamSummary.countWrong}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Per-Question Counters */}
          <div className="space-y-1">
            <div className="text-[11px] text-text/50 uppercase tracking-wider">
              ATTEMPTS PER QUESTION:
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.keys(questionAttemptCounts).length === 0 ? (
                <span className="text-xs text-text/40 font-mono">No submissions recorded</span>
              ) : (
                Object.entries(questionAttemptCounts).map(([qid, count]) => (
                  <span
                    key={qid}
                    className="px-2 py-0.5 border border-border bg-background text-xs font-mono text-text/80"
                  >
                    Question {qid}: <strong className="text-text">{count}</strong> {count === 1 ? "attempt" : "attempts"}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-emergency-red bg-emergency-red/10 p-3 text-xs text-emergency-red font-mono">
          [LOG RETRIEVAL ERROR: {error}]
        </div>
      )}

      {/* Attempts Table */}
      <div className="border border-border bg-panel/60 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-panel/90 text-text/50 text-[11px] tracking-wider uppercase">
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">TEAM NAME</th>
              <th className="py-2.5 px-3">QUESTION</th>
              <th className="py-2.5 px-3">ANSWER SUBMITTED</th>
              <th className="py-2.5 px-3 text-right">RESULT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text/40 tracking-wider">
                  {loading ? "SEARCHING INVESTIGATION ARCHIVE..." : "NO ATTEMPTS RECORDED IN LOG."}
                </td>
              </tr>
            ) : (
              attempts.map((att) => (
                <tr key={att.id} className="hover:bg-panel/90 transition-colors">
                  <td className="py-2.5 px-3 text-text/50 whitespace-nowrap">
                    {new Date(att.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-text font-semibold whitespace-nowrap">
                    {att.teamName}
                  </td>
                  <td className="py-2.5 px-3 text-primary font-bold whitespace-nowrap">
                    {att.questionId}
                  </td>
                  <td className="py-2.5 px-3 text-text/80 max-w-md break-all font-mono">
                    {/* Plain text string only, never HTML */}
                    {att.answerGiven}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {att.isCorrect ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-success text-success bg-success/10">
                        CORRECT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-emergency-red text-emergency-red bg-emergency-red/10">
                        INCORRECT
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Load More */}
      {nextCursor && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 border border-border bg-panel hover:bg-border/60 text-xs text-text uppercase tracking-widest font-mono transition-colors disabled:opacity-40"
          >
            {loadingMore ? "RETRIEVING OLDER ATTEMPTS..." : "LOAD OLDER ATTEMPTS (+50)"}
          </button>
        </div>
      )}
    </div>
  );
}
