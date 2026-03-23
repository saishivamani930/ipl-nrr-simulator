import { useMemo, useState } from 'react';
import { Calculator, AlertCircle, Trophy, TrendingUp, TrendingDown, ArrowRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { simulateMatch } from '@/lib/api';
import type { Team, MatchSimulateResult } from '@/types/api';

interface MatchSimulatorProps {
  teams: Team[];
}

interface MatchEntry {
  team1: string; team2: string;
  team1Runs: string; team1Overs: string; team1AllOut: boolean;
  team2Runs: string; team2Overs: string; team2AllOut: boolean;
}

const emptyMatch = (): MatchEntry => ({
  team1: '', team2: '',
  team1Runs: '', team1Overs: '20', team1AllOut: false,
  team2Runs: '', team2Overs: '20', team2AllOut: false,
});

const TEAM_LOGOS: Record<string, string> = {
  CSK: '/logos/CSK.png',
  DC: '/logos/DC.png',
  GT: '/logos/GT.png',
  KKR: '/logos/KKR.png',
  LSG: '/logos/LSG.png',
  MI: '/logos/MI.png',
  PBKS: '/logos/PBKS.png',
  RR: '/logos/RR.png',
  RCB: '/logos/RCB.png',
  SRH: '/logos/SRH.png',
};

function teamCode(t: Team): string {
  return t.code ?? t.team;
}
function getTeamLogo(team: Team): string {
  const code = team.code ?? team.team;
  return TEAM_LOGOS[code] ?? '';
}

function buildPlainEnglishSummary(result: MatchSimulateResult, teams: Team[]): string {
  const teamByCode = new Map(teams.map(t => [teamCode(t), t]));
  const t1Name = teamByCode.get(result.team1)?.team ?? result.team1;
  const t2Name = teamByCode.get(result.team2)?.team ?? result.team2;

  const standings = result.updated_standings;
  if (!standings || standings.length === 0) return 'Simulation complete.';

  const t1Row = standings.find(r => (r.code ?? r.team) === result.team1);
  const t2Row = standings.find(r => (r.code ?? r.team) === result.team2);

  if (!t1Row || !t2Row) return 'Simulation complete.';

  const winner = t1Row.points > t2Row.points ? t1Name : t2Row.points > t1Row.points ? t2Name : null;
  if (!winner) return 'Match tied — both teams share the points.';

  const winnerRow = winner === t1Name ? t1Row : t2Row;
  const loserRow = winner === t1Name ? t2Row : t1Row;
  const loserName = winner === t1Name ? t2Name : t1Name;

  const winnerTop4 = winnerRow.position <= 4 ? ' and are in the top 4' : '';
  const loserTop4 = loserRow.position <= 4 ? ' and remain in the top 4' : ' and are outside the top 4';
  const nrrStr = `NRR ${winnerRow.nrr >= 0 ? '+' : ''}${winnerRow.nrr.toFixed(3)}`;

  return `${winner} win and move to ${winnerRow.points} pts (${nrrStr})${winnerTop4}. ${loserName} stay on ${loserRow.points} pts${loserTop4}.`;
}

interface StandingsTableProps {
  rows: Team[];
  highlightCodes?: string[];
  label: string;
  labelColor?: string;
  beforeRows?: Team[];
}

function StandingsTable({ rows, highlightCodes = [], label, labelColor = 'text-muted-foreground', beforeRows }: StandingsTableProps) {
  const beforeByCode = useMemo(() => {
    const m = new Map<string, Team>();
    if (beforeRows) for (const r of beforeRows) m.set(r.code ?? r.team, r);
    return m;
  }, [beforeRows]);

  return (
    <div className="space-y-2">
      <p className={`text-xs font-mono uppercase tracking-widest ${labelColor}`}>{label}</p>
      <div className="overflow-hidden rounded-lg border border-white/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-white/5">
              <TableHead className="w-8 text-center text-muted-foreground text-xs">#</TableHead>
              <TableHead className="text-muted-foreground text-xs">Team</TableHead>
              <TableHead className="text-center text-muted-foreground text-xs hidden sm:table-cell">M</TableHead>
              <TableHead className="text-center text-muted-foreground text-xs hidden sm:table-cell">W</TableHead>
              <TableHead className="text-center text-muted-foreground text-xs hidden sm:table-cell">L</TableHead>
              <TableHead className="text-center text-muted-foreground text-xs sm:hidden">W-L</TableHead>
              <TableHead className="text-center text-muted-foreground text-xs">Pts</TableHead>
              <TableHead className="text-right text-muted-foreground text-xs">NRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t, idx) => {
              const code = t.code ?? t.team;
              const isHighlighted = highlightCodes.includes(code);
              const isTopFour = idx < 4;
              const before = beforeByCode.get(code);
              const posChanged = before && before.position !== t.position;
              const posUp = before && t.position < before.position;

              const currentNrr = t.nrr ?? 0;
              const beforeNrr = before?.nrr ?? 0;

              let nrrColorClass = 'text-foreground';
              let NrrIcon = Minus;

              if (beforeRows) {
                if (isHighlighted) {
                  if (currentNrr > beforeNrr) {
                    nrrColorClass = 'text-green-400';
                    NrrIcon = TrendingUp;
                  } else if (currentNrr < beforeNrr) {
                    nrrColorClass = 'text-red-400';
                    NrrIcon = TrendingDown;
                  }
                }
              } else {
                if (currentNrr > 0) {
                  nrrColorClass = 'text-green-400';
                  NrrIcon = TrendingUp;
                } else if (currentNrr < 0) {
                  nrrColorClass = 'text-red-400';
                  NrrIcon = TrendingDown;
                }
              }

              return (
                <TableRow
                  key={`${code}-${idx}`}
                  className={`border-white/5 transition-colors ${
                    isHighlighted ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/30'
                  } ${idx === 3 ? 'border-b border-primary/20' : ''}`}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className={`font-mono text-sm ${isTopFour ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {t.position}
                      </span>
                      {posChanged && (
                        <span className={`text-[9px] font-bold ml-0.5 ${posUp ? 'text-green-400' : 'text-red-400'}`}>
                          {posUp ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={getTeamLogo(t)}
                        alt={`${t.team ?? code} logo`}
                        className="h-6 w-6 rounded-full object-contain bg-white/5 p-0.5"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span
                        className={`font-semibold text-xs sm:text-sm ${isHighlighted ? 'text-primary' : 'text-foreground'}`}
                        style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      >
                        <span className="hidden sm:inline">{t.team ?? code}</span>
                        <span className="sm:hidden">{code}</span>
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs text-muted-foreground hidden sm:table-cell">
                    {t.matches ?? 0}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-green-400 hidden sm:table-cell">
                    {t.won ?? '—'}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-red-400 hidden sm:table-cell">
                    {t.lost ?? '—'}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs sm:hidden">
                    <span className="text-green-400">{t.won ?? 0}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-red-400">{t.lost ?? 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono font-bold text-sm ${isHighlighted ? 'text-primary' : 'text-foreground'}`}>
                      {t.points}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono text-xs flex items-center justify-end gap-1 ${nrrColorClass}`}>
                      <NrrIcon className="h-3 w-3" />
                      {currentNrr > 0 ? '+' : ''}{currentNrr.toFixed(3)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MatchSimulator({ teams = [] }: MatchSimulatorProps) {
  const [matches, setMatches] = useState<MatchEntry[]>([emptyMatch()]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchSimulateResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTied, setIsTied] = useState(false);
  const [superOverWinner, setSuperOverWinner] = useState('');
  const [runsWarning, setRunsWarning] = useState<string | null>(null);

  // Keep first match aliases for super over compatibility
  const team1 = matches[0].team1;
  const team2 = matches[0].team2;
  const team1Runs = matches[0].team1Runs;
  const team1Overs = matches[0].team1Overs;
  const team1AllOut = matches[0].team1AllOut;
  const team2Runs = matches[0].team2Runs;
  const team2Overs = matches[0].team2Overs;
  const team2AllOut = matches[0].team2AllOut;

  function updateMatch(idx: number, field: keyof MatchEntry, value: any) {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  const hasTeams = teams.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunsWarning(null);

    // Validate runs for all matches
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (!m.team1 || !m.team2) continue;
      if (!m.team1Runs || !m.team2Runs) {
        setRunsWarning(`Match ${i + 1}: Please enter runs for both innings before simulating.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const allResults: MatchSimulateResult[] = [];
      for (const m of matches) {
        if (!m.team1 || !m.team2) continue;
        const data = await simulateMatch({
          team1: m.team1,
          team2: m.team2,
          team1_runs: parseInt(m.team1Runs, 10) || 0,
          team1_overs: m.team1Overs,
          team1_all_out: m.team1AllOut,
          team2_runs: parseInt(m.team2Runs, 10) || 0,
          team2_overs: m.team2Overs,
          team2_all_out: m.team2AllOut,
        });
        allResults.push(data);
      }
      setResults(allResults);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      if (msg.toLowerCase().includes('tied') || msg.toLowerCase().includes('tie')) {
        setIsTied(true);
        setError(null);
        setSuperOverWinner('');
      } else {
        setError(msg);
        setIsTied(false);
        setSuperOverWinner('');
      }
    } finally {
      setLoading(false);
    }
  };

  const result = results.length > 0 ? results[results.length - 1] : null;
  const summary = result ? buildPlainEnglishSummary(result, teams) : null;
  const highlightCodes = results.flatMap(r => [r.team1, r.team2]);

  const currentStandings: Team[] = useMemo(() => {
    return [...teams].map((t, i) => ({ ...t, position: i + 1 }));
  }, [teams]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6 space-y-6">
        <h3
          className="text-lg font-bold text-foreground"
          style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em' }}
        >
          Match Details
        </h3>

        {!hasTeams ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-12 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Load standings to select teams</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {matches.map((m, idx) => (
              <div key={idx} className={`space-y-4 ${matches.length > 1 ? 'rounded-lg border border-gray-200 dark:border-white/10 p-4' : ''}`}>
                {matches.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                      Match {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMatches(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-400 hover:text-red-600 font-mono transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Batting First</Label>
                    <Select value={m.team1} onValueChange={v => updateMatch(idx, 'team1', v)}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => teamCode(t) !== m.team2).map(t => (
                          <SelectItem key={teamCode(t)} value={teamCode(t)}>{t.team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Batting Second</Label>
                    <Select value={m.team2} onValueChange={v => updateMatch(idx, 'team2', v)}>
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => teamCode(t) !== m.team1).map(t => (
                          <SelectItem key={teamCode(t)} value={teamCode(t)}>{t.team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* 1st Innings */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/5" />
                      <Label className="text-xs font-mono text-primary uppercase tracking-widest">1st Innings</Label>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid gap-3 grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Runs</Label>
                        <Input
                          type="number"
                          min="0"
                          max="400"
                          value={m.team1Runs}
                          onChange={e => updateMatch(idx, 'team1Runs', e.target.value)}
                          placeholder="e.g. 165"
                          className={`bg-secondary/50 font-mono ${!m.team1Runs && runsWarning ? 'border-red-400' : 'border-white/10'}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Overs</Label>
                        <Input
                          type="text"
                          value={m.team1Overs}
                          onChange={e => updateMatch(idx, 'team1Overs', e.target.value)}
                          placeholder="20.0"
                          className="bg-secondary/50 border-white/10 font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`team1-allout-${idx}`}
                        checked={m.team1AllOut}
                        onCheckedChange={v => updateMatch(idx, 'team1AllOut', v)}
                      />
                      <Label htmlFor={`team1-allout-${idx}`} className="text-xs text-muted-foreground">
                        All Out <span className="text-muted-foreground/60">(counts as full 20 overs)</span>
                      </Label>
                    </div>
                  </div>

                  {/* 2nd Innings */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/5" />
                      <Label className="text-xs font-mono text-primary uppercase tracking-widest">2nd Innings</Label>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid gap-3 grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Runs</Label>
                        <Input
                          type="number"
                          min="0"
                          max="400"
                          value={m.team2Runs}
                          onChange={e => updateMatch(idx, 'team2Runs', e.target.value)}
                          placeholder="e.g. 158"
                          className={`bg-secondary/50 font-mono ${!m.team2Runs && runsWarning ? 'border-red-400' : 'border-white/10'}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Overs Played</Label>
                        <Input
                          type="text"
                          value={m.team2Overs}
                          onChange={e => updateMatch(idx, 'team2Overs', e.target.value)}
                          placeholder="20.0"
                          className="bg-secondary/50 border-white/10 font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`team2-allout-${idx}`}
                        checked={m.team2AllOut}
                        onCheckedChange={v => updateMatch(idx, 'team2AllOut', v)}
                      />
                      <Label htmlFor={`team2-allout-${idx}`} className="text-xs text-muted-foreground">
                        All Out <span className="text-muted-foreground/60">(counts as full 20 overs)</span>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {runsWarning && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{runsWarning}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMatches(prev => [...prev, emptyMatch()])}
                className="gap-2 border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground text-xs"
                style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
              >
                <Plus className="h-4 w-4" />
                Add Match
              </Button>

              <Button
                type="submit"
                disabled={matches.every(m => !m.team1 || !m.team2) || loading}
                className="flex-1 gap-2 glow-gold font-semibold disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-200"
                style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em', fontSize: '0.95rem' }}
              >
                <Calculator className="h-4 w-4" />
                {loading ? 'SIMULATING...' : matches.length > 1 ? `SIMULATE ${matches.length} MATCHES` : 'SIMULATE MATCH'}
              </Button>
            </div>
          </form>
        )}

        {error && !isTied && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isTied && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm text-foreground font-semibold" style={{ fontFamily: 'Rajdhani,sans-serif' }}>
              ⚡ Scores Tied — Super Over
            </p>
            <p className="text-xs text-muted-foreground">
              The match is tied. NRR is calculated on the tied scores. Select the Super Over winner for points only.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={superOverWinner} onValueChange={setSuperOverWinner}>
                <SelectTrigger className="bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Select Super Over winner" />
                </SelectTrigger>
                <SelectContent>
                  {team1 && <SelectItem value={team1}>{teams.find(t => (t.code ?? t.team) === team1)?.team ?? team1}</SelectItem>}
                  {team2 && <SelectItem value={team2}>{teams.find(t => (t.code ?? t.team) === team2)?.team ?? team2}</SelectItem>}
                </SelectContent>
              </Select>
              <Button
                disabled={!superOverWinner || loading}
                className="gap-2 glow-gold font-semibold"
                style={{ fontFamily: 'Rajdhani,sans-serif', letterSpacing: '0.05em' }}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const data = await simulateMatch({
                      team1,
                      team2,
                      team1_runs: parseInt(team1Runs, 10) || 0,
                      team1_overs: team1Overs,
                      team1_all_out: team1AllOut,
                      team2_runs: parseInt(team2Runs, 10) || 0,
                      team2_overs: team2Overs,
                      team2_all_out: team2AllOut,
                      result: 'WIN',
                      winner: superOverWinner,
                    });
                    setResults([data]);
                    setIsTied(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Simulation failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                APPLY SUPER OVER RESULT
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tables section */}
      {hasTeams && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6 space-y-4">
          {summary && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Trophy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{summary}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <StandingsTable
                rows={currentStandings}
                highlightCodes={highlightCodes}
                label="Before"
                labelColor="text-muted-foreground"
              />
              <div className="hidden lg:flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-primary opacity-60" />
              </div>
              <StandingsTable
                rows={result.updated_standings}
                highlightCodes={highlightCodes}
                label="After"
                labelColor="text-primary"
                beforeRows={currentStandings}
              />
            </div>
          ) : (
            <StandingsTable
              rows={currentStandings}
              label="Current Points Table"
              labelColor="text-muted-foreground"
            />
          )}

          <p className="text-xs text-muted-foreground/50">
            ▲▼ position change after simulation · Top 4 qualify for playoffs
          </p>
        </div>
      )}
    </div>
  );
}