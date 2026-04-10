import { useState, useEffect } from "react";
import { Calculator, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiTeamSelect } from "../MultiTeamSelect";
import { calculateChaseMinScore } from "@/lib/api";
import type { Team, ThresholdResult } from "@/types/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props { teams: Team[]; defaultChaser?: string; }

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

export function ChaseMinScoreCalculator({ teams, defaultChaser }: Props) {
  const [chasingTeam, setChasingTeam] = useState(defaultChaser ?? "");
  const [opponentTeam, setOpponentTeam] = useState("");
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [opponentScore, setOpponentScore] = useState("");
  const [chaseOvers, setChaseOvers] = useState("20.0");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ team: string; result: ThresholdResult }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (defaultChaser) setChasingTeam(defaultChaser); }, [defaultChaser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chasingTeam || !opponentTeam || targetTeams.length === 0 || !opponentScore) return;
    setLoading(true); setError(null); setResults([]);
    try {
      const all = await Promise.all(
        targetTeams.map(async (targetTeam) => {
          const raw = await calculateChaseMinScore({
            chasing_team: chasingTeam, opponent_team: opponentTeam,
            target_team: targetTeam, target_score: Number(opponentScore),
            assume_chase_balls: oversToBalls(chaseOvers),
          });
          const result = extractResult(raw);
          if (!result) throw new Error("Unexpected response from API.");
          return { team: targetTeam, result };
        })
      );
      setResults(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally { setLoading(false); }
  };

  const isValid = Boolean(chasingTeam && opponentTeam && targetTeams.length > 0 && opponentScore);

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Chasing Team</Label>
          <Select value={chasingTeam} onValueChange={setChasingTeam}>
            <SelectTrigger className="bg-secondary/50 border-white/10">
              <SelectValue placeholder="Select chasing team" />
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
                .filter((team) => team.team !== chasingTeam)
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
          excludeTeams={[chasingTeam]}
          placeholder="Select one or more rivals..."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Opponent's Score</Label>
            <Input type="number" min="0" max="400" value={opponentScore}
              onChange={e => setOpponentScore(e.target.value)} placeholder="e.g., 165"
              className="bg-secondary/50 border-white/10 font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Overs Faced <span className="text-muted-foreground/50">(20.0 = full innings)</span></Label>
            <Input type="text" value={chaseOvers} onChange={e => setChaseOvers(e.target.value)}
              placeholder="20.0" className="bg-secondary/50 border-white/10 font-mono" />
          </div>
        </div>

        <Button type="submit" disabled={!isValid || loading}
          className="w-full gap-2 glow-gold font-semibold" style={{fontFamily:'Rajdhani,sans-serif',letterSpacing:'0.05em'}}>
          <Calculator className="h-4 w-4" />{loading ? "CALCULATING..." : "CALCULATE MINIMUM SCORE"}
        </Button>
      </form>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm"><AlertCircle className="h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(({ team, result }) => (
            <div key={team} className={`rounded-lg border p-4 ${result.ok ? "border-green-500/30 bg-green-500/10" : "border-yellow-500/30 bg-yellow-500/10"}`}>
              {result.ok ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">vs {team}</p>
                    <p className="font-bold text-foreground" style={{fontFamily:'Rajdhani,sans-serif'}}>
                      Minimum Score: <span className="text-primary font-mono">{result.value} runs</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {chasingTeam} must score at least {result.value} runs (even losing) to stay above {team} on NRR.
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
