import { useState, useEffect } from "react";
import { Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamSelect } from "@/components/TeamSelect";
import { calculateChaseMinScore } from "@/lib/api";
import type { Team, ThresholdResult } from "@/types/api";

interface ChaseMinScoreCalculatorProps {
  teams: Team[];
  defaultChaser?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Backend may return either:
// A) ThresholdResult directly
// B) Wrapper: { season, input, result: ThresholdResult }
function extractThresholdResult(payload: unknown): ThresholdResult | null {
  if (!isRecord(payload)) return null;

  const maybeResult = payload["result"];
  const obj = (isRecord(maybeResult) ? maybeResult : payload) as Record<string, unknown>;

  if (typeof obj["ok"] !== "boolean") return null;
  return obj as unknown as ThresholdResult;
}

export function ChaseMinScoreCalculator({ teams, defaultChaser }: ChaseMinScoreCalculatorProps) {
  const [chasingTeam, setChasingTeam] = useState(defaultChaser || "");
  const [opponentTeam, setOpponentTeam] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [opponentScore, setOpponentScore] = useState("");
  const [chaseBalls, setChaseBalls] = useState("120");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThresholdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultChaser) setChasingTeam(defaultChaser);
  }, [defaultChaser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chasingTeam || !opponentTeam || !targetTeam || !opponentScore) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ Send ONLY what the backend should validate for chase-loss/min-score
      // ✅ Do NOT send season/source here (api.ts already sends them via query params)
      // ✅ Do NOT send target_score/assume_chase_balls (can cause 422 if backend forbids extra fields)
      const raw = await calculateChaseMinScore({
        chasing_team: chasingTeam,
        opponent_team: opponentTeam,
        target_team: targetTeam,
        target_score: Number(opponentScore),
        assume_chase_balls: Number(chaseBalls) || 120,
      });

      const extracted = extractThresholdResult(raw);
      if (!extracted) throw new Error("API returned unexpected response shape for threshold result.");

      setResult(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Boolean(chasingTeam && opponentTeam && targetTeam && opponentScore);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Purpose:</strong> If my team is chasing and loses, what is the minimum
          score required to stay above another team on NRR?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect label="Chasing Team" value={chasingTeam} onChange={setChasingTeam} teams={teams} />
          <TeamSelect label="Opponent Team" value={opponentTeam} onChange={setOpponentTeam} teams={teams} />
        </div>

        <TeamSelect
          label="Target Team (to stay above)"
          value={targetTeam}
          onChange={setTargetTeam}
          teams={teams}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Opponent Score</Label>
            <Input
              type="number"
              min="0"
              max="400"
              value={opponentScore}
              onChange={(e) => setOpponentScore(e.target.value)}
              placeholder="e.g., 165"
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Chase Balls (assumed)</Label>
            <Input
              type="number"
              min="1"
              max="120"
              value={chaseBalls}
              onChange={(e) => setChaseBalls(e.target.value)}
              placeholder="120"
              className="bg-secondary/50"
            />
          </div>
        </div>

        <Button type="submit" disabled={!isFormValid || loading} className="w-full gap-2">
          <Calculator className="h-4 w-4" />
          {loading ? "Calculating..." : "Calculate Minimum Score"}
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.ok
              ? "border-success/30 bg-success/10 text-success"
              : "border-warning/30 bg-warning/10 text-foreground"
          }`}
        >
          {result.ok ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Minimum Score: {result.value} runs</p>
                <p className="mt-1 text-sm opacity-90">
                  {chasingTeam} must score at least {result.value} runs (even in a loss) to stay above {targetTeam} on NRR.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p>{result.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
