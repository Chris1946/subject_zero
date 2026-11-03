import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AttemptsQuerySchema = z.object({
  teamId: z.string().uuid().optional(),
  questionId: z.string().max(10).optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
});

interface AttemptRow {
  id: number;
  team_id: string;
  question_id: string;
  answer_given: string;
  is_correct: boolean;
  created_at: string;
  teams?: { name: string } | null;
}

export async function GET(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = AttemptsQuerySchema.safeParse({
      teamId: searchParams.get("teamId") || undefined,
      questionId: searchParams.get("questionId") || undefined,
      limit: searchParams.get("limit") || undefined,
      before: searchParams.get("before") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { teamId, questionId, limit, before } = parsed.data;
    const supabase = getServerClient();

    let query = supabase
      .from("attempts")
      .select("id, team_id, question_id, answer_given, is_correct, created_at, teams(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }
    if (questionId) {
      query = query.eq("question_id", questionId);
    }
    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: attemptsData, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to query attempts log", details: error.message },
        { status: 500 }
      );
    }

    const rows = (attemptsData || []) as unknown as AttemptRow[];

    const attempts = rows.map((r) => ({
      id: r.id,
      teamId: r.team_id,
      teamName: r.teams?.name ?? "Unknown Team",
      questionId: r.question_id,
      answerGiven: r.answer_given, // Plain text rendered to admins only
      isCorrect: r.is_correct,
      createdAt: r.created_at,
    }));

    // If filtered by team, compute summary metrics
    let teamSummary: {
      firstAttemptTime: string | null;
      lastAttemptTime: string | null;
      countWrong: number;
      countCorrect: number;
    } | null = null;

    if (teamId) {
      const { data: teamAttempts } = await supabase
        .from("attempts")
        .select("is_correct, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true });

      if (teamAttempts && teamAttempts.length > 0) {
        teamSummary = {
          firstAttemptTime: teamAttempts[0].created_at,
          lastAttemptTime: teamAttempts[teamAttempts.length - 1].created_at,
          countWrong: teamAttempts.filter((a) => !a.is_correct).length,
          countCorrect: teamAttempts.filter((a) => a.is_correct).length,
        };
      }
    }

    return NextResponse.json(
      {
        attempts,
        teamSummary,
        hasMore: attempts.length === limit,
        nextCursor: attempts.length > 0 ? attempts[attempts.length - 1].createdAt : null,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to process attempts log request", details: message },
      { status: 500 }
    );
  }
}
