import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeamSelect } from '@/components/TeamSelect';
import { calculateChaseWinMaxBalls } from '@/lib/api';
import type { Team, ThresholdResult } from '@/types/api';

interface ChaseWinMaxBallsCalculatorProps {
  teams: Team[];
  defaultChaser?: string;
}

type AnyObj = Record<string, unknown>;
function isObj(v: unknown): v is AnyObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function ChaseWinMaxBallsCalculator({ teams, defaultChaser }: ChaseWinMaxBallsCalculatorProps) {
  const [chasingTeam, setChasingTeam] = useState(defaultChaser || '');

  useEffect(() => {
    if (defaultChaser) setChasingTeam(defaultChaser);
  }, [defaultChaser]);

  const [opponentTeam, setOpponentTeam] = useState('');
  const [targetTeam, setTargetTeam] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThresholdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chasingTeam || !opponentTeam || !targetTeam || !targetScore) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        season: 2026,
        source: 'live',
        chasing_team: chasingTeam,
        opponent_team: opponentTeam,
        target_team: targetTeam,

        // backend expects this key
        target_score: parseInt(targetScore, 10),

        // UI doesn't ask "balls", but backend may require assumed chase balls
        assume_chase_balls: 120,
      };

      const data = await calculateChaseWinMaxBalls(payload);

      // backend returns { season, input, result } => extract `result`
      const extracted = isObj(data) && isObj(data.result) ? data.result : data;

      setResult(extracted as ThresholdResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = chasingTeam && opponentTeam && targetTeam && targetScore;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Purpose:</strong> If my team is chasing and wins, how slowly can we
          chase and still stay above another team?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Chasing Team"
            value={chasingTeam}
            onChange={setChasingTeam}
            teams={teams}
            excludeTeams={[opponentTeam]}
          />
          <TeamSelect
            label="Opponent Team"
            value={opponentTeam}
            onChange={setOpponentTeam}
            teams={teams}
            excludeTeams={[chasingTeam]}
          />
        </div>

        <TeamSelect
          label="Target Team (to stay above)"
          value={targetTeam}
          onChange={setTargetTeam}
          teams={teams}
          excludeTeams={[chasingTeam]}
        />

        <div className="space-y-2">
          <Label>Target Score (to chase)</Label>
          <Input
            type="number"
            min="1"
            max="400"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            placeholder="e.g., 166"
          />
        </div>

        <Button type="submit" disabled={!isFormValid || loading} className="w-full gap-2">
          <Clock className="h-4 w-4" />
          {loading ? 'Calculating...' : 'Calculate Slowest Safe Chase'}
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-4 ${
            result.ok ? 'bg-success/10 text-success' : 'bg-warning/10 text-foreground'
          }`}
        >
          {result.ok ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">
                  Maximum Balls: {result.value}
                  {result.details?.overs_str && ` (${result.details.overs_str} overs)`}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  {chasingTeam} can take up to{' '}
                  {result.details?.overs_str || `${result.value} balls`} to chase and
                  still stay above {targetTeam} on NRR.
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
