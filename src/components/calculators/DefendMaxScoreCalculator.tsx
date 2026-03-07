import { useEffect, useState } from "react";
import { Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamSelect } from "@/components/TeamSelect";
import { calculateDefendMaxScore } from "@/lib/api";
import type { Team, ThresholdResult } from "@/types/api";

interface DefendMaxScoreCalculatorProps {
  teams: Team[];
  defaultDefender?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Backend may return either:
 * A) ThresholdResult directly
 * B) Wrapper: { season, input, result: ThresholdResult }
 */
function extractThresholdResult(payload: unknown): ThresholdResult | null {
  if (!isRecord(payload)) return null;

  const maybeResult = payload["result"];
  const obj = (isRecord(maybeResult) ? maybeResult : payload) as Record<string, unknown>;

  if (typeof obj["ok"] !== "boolean") return null;
  return obj as unknown as ThresholdResult;
}

export function DefendMaxScoreCalculator({
  teams,
  defaultDefender,
}: DefendMaxScoreCalculatorProps) {
  const [defendingTeam, setDefendingTeam] = useState(defaultDefender || "");
  const [opponentTeam, setOpponentTeam] = useState("");
  const [targetTeam, setTargetTeam] = useState("");

  const [defendingScore, setDefendingScore] = useState("");
  const [opponentBalls, setOpponentBalls] = useState("120");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThresholdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDefender) setDefendingTeam(defaultDefender);
  }, [defaultDefender]);

  const isFormValid = Boolean(
    defendingTeam &&
      opponentTeam &&
      targetTeam &&
      defendingScore &&
      Number.isFinite(Number(defendingScore)) &&
      Number.isFinite(Number(opponentBalls))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ Send ONLY what backend is expected to validate for this endpoint.
      // api.ts will:
      // - add season/source as query params
      // - convert team names -> team codes (if cached)
      const raw = await calculateDefendMaxScore({
        defending_team: defendingTeam,
        opponent_team: opponentTeam,
        target_team: targetTeam,
        defending_score: Number(defendingScore),
        opponent_balls: Number(opponentBalls) || 120,
      });

      const extracted = extractThresholdResult(raw);
      if (!extracted) {
        throw new Error("API returned unexpected response shape for threshold result.");
      }

      setResult(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Purpose:</strong> If my team is defending and wins,
          what is the maximum score the opponent can make so I still stay above another team?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Defending Team"
            value={defendingTeam}
            onChange={setDefendingTeam}
            teams={teams}
          />
          <TeamSelect
            label="Opponent Team"
            value={opponentTeam}
            onChange={setOpponentTeam}
            teams={teams}
          />
        </div>

        <TeamSelect
          label="Target Team (to stay above)"
          value={targetTeam}
          onChange={setTargetTeam}
          teams={teams}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Defending Score</Label>
            <Input
              type="number"
              min="0"
              max="400"
              value={defendingScore}
              onChange={(e) => setDefendingScore(e.target.value)}
              placeholder="e.g., 175"
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Opponent Balls (assumed)</Label>
            <Input
              type="number"
              min="1"
              max="120"
              value={opponentBalls}
              onChange={(e) => setOpponentBalls(e.target.value)}
              placeholder="120"
              className="bg-secondary/50"
            />
          </div>
        </div>

        <Button type="submit" disabled={!isFormValid || loading} className="w-full gap-2">
          <Calculator className="h-4 w-4" />
          {loading ? "Calculating..." : "Calculate Max Opponent Score"}
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
                <p className="font-semibold">Max Opponent Score: {result.value} runs</p>
                <p className="mt-1 text-sm opacity-90">
                  If {defendingTeam} scores {defendingScore} and wins, the opponent must be restricted
                  to at most {result.value} to stay above {targetTeam} on NRR.
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
