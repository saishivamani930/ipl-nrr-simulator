import { useEffect, useState } from "react";
import { Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiTeamSelect } from "../MultiTeamSelect";
import { calculateDefendMaxScore } from "@/lib/api";
import type { Team, ThresholdResult } from "@/types/api";

interface Props {
  teams: Team[];
  defaultDefender?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function extractResult(payload: unknown): ThresholdResult | null {
  if (!isRecord(payload)) return null;
  const maybeResult = payload["result"];
  const obj = (isRecord(maybeResult) ? maybeResult : payload) as Record<string, unknown>;
  if (typeof obj["ok"] !== "boolean") return null;
  return obj as unknown as ThresholdResult;
}

function oversToBalls(overs: string): number {
  const [whole, part] = overs.split(".");
  const w = parseInt(whole || "0", 10);
  const p = parseInt((part || "0").charAt(0), 10);
  return w * 6 + (isNaN(p) ? 0 : Math.min(p, 5));
}

export function DefendMaxScoreCalculator({ teams, defaultDefender }: Props) {
  const [defendingTeam, setDefendingTeam] = useState(() => defaultDefender || "");
  const [opponentTeam, setOpponentTeam] = useState("");
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [defendingScore, setDefendingScore] = useState("");
  const [opponentOvers, setOpponentOvers] = useState("20");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ team: string; result: ThresholdResult }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDefender) setDefendingTeam(defaultDefender);
  }, [defaultDefender]);

  const isValid = Boolean(
    defendingTeam &&
      opponentTeam &&
      defendingTeam !== opponentTeam &&
      targetTeams.length > 0 &&
      defendingScore &&
      Number.isFinite(Number(defendingScore))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const all = await Promise.all(
        targetTeams.map(async (targetTeam) => {
          const raw = await calculateDefendMaxScore({
            defending_team: defendingTeam,
            opponent_team: opponentTeam,
            target_team: targetTeam,
            defending_score: Number(defendingScore),
            opponent_balls: oversToBalls(opponentOvers),
          });

          const result = extractResult(raw);
          if (!result) throw new Error("Unexpected response from API.");

          return { team: targetTeam, result };
        })
      );

      setResults(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Defending Team</Label>
            <Select value={defendingTeam} onValueChange={setDefendingTeam}>
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue placeholder="Select defending team" />
              </SelectTrigger>
              <SelectContent>
                {teams
                  .filter((team) => team.team !== opponentTeam)
                  .map((team) => (
                    <SelectItem key={team.team} value={team.team}>
                      {team.team}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Opponent Team</Label>
            <Select value={opponentTeam} onValueChange={setOpponentTeam}>
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue placeholder="Select opponent team" />
              </SelectTrigger>
              <SelectContent>
                {teams
                  .filter((team) => team.team !== defendingTeam)
                  .map((team) => (
                    <SelectItem key={team.team} value={team.team}>
                      {team.team}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <MultiTeamSelect
          label="Target Teams (to stay above on NRR)"
          values={targetTeams}
          onChange={setTargetTeams}
          teams={teams}
          excludeTeams={[defendingTeam, opponentTeam]}
          placeholder="Select one or more rivals..."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Your Score (batting first)</Label>
            <Input
              type="number"
              min="0"
              max="400"
              value={defendingScore}
              onChange={(e) => setDefendingScore(e.target.value)}
              placeholder="e.g., 175"
              className="bg-secondary/50 border-white/10 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Opponent Overs <span className="text-muted-foreground/50">(20.0 = full innings)</span>
            </Label>
            <Input
              type="text"
              value={opponentOvers}
              onChange={(e) => setOpponentOvers(e.target.value)}
              placeholder="20.0"
              className="bg-secondary/50 border-white/10 font-mono"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!isValid || loading}
          className="w-full gap-2 glow-gold font-semibold"
          style={{ fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.05em" }}
        >
          <Calculator className="h-4 w-4" />
          {loading ? "CALCULATING..." : "CALCULATE MAX OPPONENT SCORE"}
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(({ team, result }) => (
            <div
              key={team}
              className={`rounded-lg border p-4 ${
                result.ok
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-yellow-500/30 bg-yellow-500/10"
              }`}
            >
              {result.ok ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">vs {team}</p>
                    <p
                      className="font-bold text-foreground"
                      style={{ fontFamily: "Rajdhani,sans-serif" }}
                    >
                      Max Opponent Score:{" "}
                      <span className="text-primary font-mono">{result.value} runs</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Restrict the opponent to at most {result.value} runs to stay above {team} on NRR.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">vs {team}</p>
                    <p className="text-sm text-muted-foreground">{result.reason}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}