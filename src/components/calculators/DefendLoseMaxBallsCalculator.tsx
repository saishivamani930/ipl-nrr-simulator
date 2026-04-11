import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiTeamSelect } from '../MultiTeamSelect';
import { calculateDefendLoseMaxBalls } from '@/lib/api';
import type { Team, ThresholdResult } from '@/types/api';

interface Props {
  teams: Team[];
  defaultDefender?: string;
}

type AnyObj = Record<string, unknown>;

function isObj(v: unknown): v is AnyObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function ballsToOvers(balls: number): string {
  const o = Math.floor(balls / 6);
  const b = balls % 6;
  return b === 0 ? `${o} overs` : `${o}.${b} overs`;
}

export function DefendLoseMaxBallsCalculator({ teams, defaultDefender }: Props) {
  const [defendingTeam, setDefendingTeam] = useState(() => defaultDefender || '');
  const [opponentTeam, setOpponentTeam] = useState('');
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [defendingScore, setDefendingScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ team: string; result: ThresholdResult }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDefender) setDefendingTeam(defaultDefender);
  }, [defaultDefender]);

  const isFormValid = Boolean(
    defendingTeam &&
    opponentTeam &&
    defendingTeam !== opponentTeam &&
    targetTeams.length > 0 &&
    defendingScore
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const all = await Promise.all(
        targetTeams.map(async (targetTeam) => {
          const data = await calculateDefendLoseMaxBalls({
            season: 2026,
            source: 'live',
            defending_team: defendingTeam,
            opponent_team: opponentTeam,
            target_team: targetTeam,
            defending_score: parseInt(defendingScore, 10),
          });

          console.log("RAW API response:", JSON.stringify(all, null, 2));

          const extracted = isObj(data) && isObj((data as any).result) 
          ? (data as any).result 
          : data;

          return {
            team: targetTeam,
            result: extracted as ThresholdResult,
          };
        })
      );

      setResults(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
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

        {/* NOTE: opponent NOT excluded — you may want to stay above them on NRR too */}
        <MultiTeamSelect
          label="Target Teams (to stay above on NRR)"
          values={targetTeams}
          onChange={setTargetTeams}
          teams={teams}
          excludeTeams={[defendingTeam]}
          placeholder="Select one or more rivals..."
        />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Your Score (batting first)</Label>
          <Input
            type="number"
            min="1"
            max="400"
            value={defendingScore}
            onChange={(e) => setDefendingScore(e.target.value)}
            placeholder="e.g., 200"
            className="bg-secondary/50 border-white/10 font-mono"
          />
        </div>

        <Button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full gap-2 glow-gold font-semibold"
          style={{ fontFamily: 'Rajdhani,sans-serif', letterSpacing: '0.05em' }}
        >
          <Clock className="h-4 w-4" />
          {loading ? 'CALCULATING...' : 'CALCULATE MAX BALLS TO CHASE'}
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
          {results.map(({ team, result }) => {
            const oversDisplay =
              result.ok && result.value
                ? (ballsToOvers(result.value))
                : null;

            return (
              <div
                key={team}
                className={`rounded-lg border p-4 ${
                  result.ok
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-yellow-500/30 bg-yellow-500/10'
                }`}
              >
                {result.ok ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">vs {team}</p>
                      <p
                        className="font-bold text-foreground"
                        style={{ fontFamily: 'Rajdhani,sans-serif' }}
                      >
                        Opponent must take at least:{' '}
                        <span className="text-primary font-mono">{oversDisplay}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                         If {opponentTeam} chases your score faster than {oversDisplay},{' '}
                         {defendingTeam} will drop below {team} on NRR.
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
            );
          })}
        </div>
      )}
    </div>
  );
}