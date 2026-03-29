import { useMemo, useRef, useState } from 'react';
import { Calculator, AlertCircle, Trophy, TrendingUp, TrendingDown, ArrowRight, Minus, Plus, Zap } from 'lucide-react';
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
import { simulateMatch, simulateMatchBatch } from '@/lib/api';
import type { Team, MatchSimulateResult } from '@/types/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_MATCHES = 14;

// ─── Types ───────────────────────────────────────────────────────────────────
interface MatchSimulatorProps {
  teams: Team[];
}

interface MatchEntry {
  id: string; // stable — never changes even when other matches are removed
  team1: string; team2: string;
  team1Runs: string; team1Overs: string; team1AllOut: boolean;
  team2Runs: string; team2Overs: string; team2AllOut: boolean;
  isTied: boolean;
  superOverWinner: string;
}

let _matchIdCounter = 0;
const emptyMatch = (): MatchEntry => ({
  id: `match-${++_matchIdCounter}`,
  team1: '', team2: '',
  team1Runs: '', team1Overs: '20', team1AllOut: false,
  team2Runs: '', team2Overs: '20', team2AllOut: false,
  isTied: false,
  superOverWinner: '',
});

// ─── Logos ───────────────────────────────────────────────────────────────────
const TEAM_LOGOS: Record<string, string> = {
  CSK: '/logos/CSK.png', DC: '/logos/DC.png', GT: '/logos/GT.png',
  KKR: '/logos/KKR.png', LSG: '/logos/LSG.png', MI: '/logos/MI.png',
  PBKS: '/logos/PBKS.png', RR: '/logos/RR.png', RCB: '/logos/RCB.png',
  SRH: '/logos/SRH.png',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function teamCode(t: Team): string { return t.code ?? t.team; }
function getTeamLogo(team: Team): string { return TEAM_LOGOS[team.code ?? team.team] ?? ''; }
function getTeamName(code: string, teams: Team[]): string {
  return teams.find(t => (t.code ?? t.team) === code)?.team ?? code;
}
function getTeamMatchCount(code: string, teams: Team[]): number {
  const t = teams.find(t => (t.code ?? t.team) === code);
  return t?.matches ?? t?.played ?? 0;
}

/**
 * Walk through the batch in order, accumulating match counts.
 * Returns the first match index where any team would exceed MAX_MATCHES,
 * along with the names of the offending team(s). Returns null if no violation.
 */
function findFirstOverLimitMatch(
  matches: MatchEntry[],
  teams: Team[],
): { matchId: string; offendingTeams: string[] } | null {
  // Seed with real played counts
  const running = new Map<string, number>();
  for (const t of teams) running.set(t.code ?? t.team, t.matches ?? t.played ?? 0);

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m.team1 || !m.team2) continue;

    const t1After = (running.get(m.team1) ?? 0) + 1;
    const t2After = (running.get(m.team2) ?? 0) + 1;

    const offending: string[] = [];
    if (t1After > MAX_MATCHES) offending.push(getTeamName(m.team1, teams));
    if (t2After > MAX_MATCHES) offending.push(getTeamName(m.team2, teams));

    if (offending.length > 0) return { matchId: m.id, offendingTeams: offending };

    running.set(m.team1, t1After);
    running.set(m.team2, t2After);
  }
  return null;
}

function buildPlainEnglishSummary(result: MatchSimulateResult, teams: Team[]): string {
  const teamByCode = new Map(teams.map(t => [teamCode(t), t]));
  const t1Name = teamByCode.get(result.team1)?.team ?? result.team1;
  const t2Name = teamByCode.get(result.team2)?.team ?? result.team2;
  const standings = result.updated_standings;
  if (!standings?.length) return 'Simulation complete.';
  const t1Row = standings.find(r => (r.code ?? r.team) === result.team1);
  const t2Row = standings.find(r => (r.code ?? r.team) === result.team2);
  if (!t1Row || !t2Row) return 'Simulation complete.';
  const winner = t1Row.points > t2Row.points ? t1Name : t2Row.points > t1Row.points ? t2Name : null;
  if (!winner) return 'Match tied — both teams share the points.';
  const winnerRow = winner === t1Name ? t1Row : t2Row;
  const loserRow  = winner === t1Name ? t2Row : t1Row;
  const loserName = winner === t1Name ? t2Name : t1Name;
  return `${winner} win and move to ${winnerRow.points} pts (NRR ${winnerRow.nrr >= 0 ? '+' : ''}${winnerRow.nrr.toFixed(3)})${winnerRow.position <= 4 ? ' and are in the top 4' : ''}. ${loserName} stay on ${loserRow.points} pts${loserRow.position <= 4 ? ' and remain in the top 4' : ' and are outside the top 4'}.`;
}

// ─── StandingsTable ───────────────────────────────────────────────────────────
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
                  if (currentNrr > beforeNrr) { nrrColorClass = 'text-green-400'; NrrIcon = TrendingUp; }
                  else if (currentNrr < beforeNrr) { nrrColorClass = 'text-red-400'; NrrIcon = TrendingDown; }
                }
              } else {
                if (currentNrr > 0) { nrrColorClass = 'text-green-400'; NrrIcon = TrendingUp; }
                else if (currentNrr < 0) { nrrColorClass = 'text-red-400'; NrrIcon = TrendingDown; }
              }
              return (
                <TableRow
                  key={`${code}-${idx}`}
                  className={`border-white/5 transition-colors ${isHighlighted ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/30'} ${idx === 3 ? 'border-b border-primary/20' : ''}`}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className={`font-mono text-sm ${isTopFour ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{t.position}</span>
                      {posChanged && (
                        <span className={`text-[9px] font-bold ml-0.5 ${posUp ? 'text-green-400' : 'text-red-400'}`}>{posUp ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img src={getTeamLogo(t)} alt={`${t.team ?? code} logo`} className="h-6 w-6 rounded-full object-contain bg-white/5 p-0.5" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <span className={`font-semibold text-xs sm:text-sm ${isHighlighted ? 'text-primary' : 'text-foreground'}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        <span className="hidden sm:inline">{t.team ?? code}</span>
                        <span className="sm:hidden">{code}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground hidden sm:table-cell">{t.matches ?? t.played ?? 0}</TableCell>
                  <TableCell className="text-center font-mono text-xs text-green-400 hidden sm:table-cell">{t.won ?? '—'}</TableCell>
                  <TableCell className="text-center font-mono text-xs text-red-400 hidden sm:table-cell">{t.lost ?? '—'}</TableCell>
                  <TableCell className="text-center font-mono text-xs sm:hidden">
                    <span className="text-green-400">{t.won ?? 0}</span><span className="text-muted-foreground">-</span><span className="text-red-400">{t.lost ?? 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono font-bold text-sm ${isHighlighted ? 'text-primary' : 'text-foreground'}`}>{t.points}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono text-xs flex items-center justify-end gap-1 ${nrrColorClass}`}>
                      <NrrIcon className="h-3 w-3" />{currentNrr > 0 ? '+' : ''}{currentNrr.toFixed(3)}
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

// ─── Converters ───────────────────────────────────────────────────────────────
function convertBatchResult(r: any): MatchSimulateResult {
  return {
    team1: r.team1, team2: r.team2,
    result_description: `Match ${r.match_index} simulated`,
    updated_standings: r.updated_table.map((row: any, i: number) => ({ ...row, team: row.team ?? row.code, position: i + 1 })),
  };
}

function parseTiedMatchIndex(msg: string): number {
  const m = msg.match(/match\s+(\d+)/i);
  return m ? parseInt(m[1], 10) - 1 : 0;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MatchSimulator({ teams = [] }: MatchSimulatorProps) {
  const [matches, setMatches]               = useState<MatchEntry[]>([emptyMatch()]);
  const [loading, setLoading]               = useState(false);
  const [results, setResults]               = useState<MatchSimulateResult[]>([]);
  const [error, setError]                   = useState<string | null>(null);
  const [runsWarning, setRunsWarning]       = useState<string | null>(null);
  // Index + team names for the first over-limit match in a batch
  const [overLimitId, setOverLimitId]       = useState<string | null>(null);
  const [overLimitNames, setOverLimitNames] = useState<string[]>([]);

  // One DOM ref per match card so we can scroll to it
  // Keyed by stable match ID — immune to index shifts caused by removals
  const matchCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  // ── helpers ────────────────────────────────────────────────────────────────
  function clearOverLimit() { setOverLimitId(null); setOverLimitNames([]); }

  function updateMatch(idx: number, field: keyof MatchEntry, value: any) {
    if (matches[idx]?.id === overLimitId) clearOverLimit(); // editing the offending match clears the warning
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  }

  function markMatchTied(tiedIdx: number) {
    setMatches(prev => prev.map((m, i) =>
      i === tiedIdx ? { ...m, isTied: true, superOverWinner: '' } : { ...m, isTied: false, superOverWinner: '' }
    ));
  }

  function removeMatch(idx: number) {
    const id = matches[idx]?.id;
    if (id === overLimitId) clearOverLimit();
    if (id) matchCardRefs.current.delete(id); // clean up the map entry
    setMatches(prev => prev.filter((_, i) => i !== idx));
  }

  const anyMatchPendingSuperOver = matches.some(m => m.isTied && !m.superOverWinner);
  const hasTeams = teams.length > 0;

  // ── payload builder ────────────────────────────────────────────────────────
  const buildBatchPayload = (matchList: MatchEntry[]) =>
    matchList.filter(m => m.team1 && m.team2).map(m => ({
      team1: m.team1, team2: m.team2,
      team1_runs: parseInt(m.team1Runs, 10) || 0, team1_overs: m.team1Overs, team1_all_out: m.team1AllOut,
      team2_runs: parseInt(m.team2Runs, 10) || 0, team2_overs: m.team2Overs, team2_all_out: m.team2AllOut,
      ...(m.isTied && m.superOverWinner ? { result: 'WIN' as const, winner: m.superOverWinner } : {}),
    }));

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunsWarning(null);
    clearOverLimit();

    // 1. Runs validation
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (!m.team1 || !m.team2) continue;
      if (!m.team1Runs || !m.team2Runs) {
        setRunsWarning(`Match ${i + 1}: Please enter runs for both innings before simulating.`);
        return;
      }
    }

    // 2. Cumulative max-matches check across the entire batch
    const violation = findFirstOverLimitMatch(matches, teams);
    if (violation) {
      setOverLimitId(violation.matchId);
      setOverLimitNames(violation.offendingTeams);
      // Let React paint the warning banner first, then scroll
      setTimeout(() => {
        matchCardRefs.current.get(violation.matchId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
      return; // block simulation
    }

    await runSimulation();
  };

  // ── simulation ─────────────────────────────────────────────────────────────
  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const validMatches = matches.filter(m => m.team1 && m.team2);
      if (validMatches.length === 1 && !validMatches[0].isTied) {
        const m = validMatches[0];
        const data = await simulateMatch({
          team1: m.team1, team2: m.team2,
          team1_runs: parseInt(m.team1Runs, 10) || 0, team1_overs: m.team1Overs, team1_all_out: m.team1AllOut,
          team2_runs: parseInt(m.team2Runs, 10) || 0, team2_overs: m.team2Overs, team2_all_out: m.team2AllOut,
        });
        setResults([data]);
      } else {
        const batchData = await simulateMatchBatch(buildBatchPayload(matches));
        setResults(batchData.results.map(convertBatchResult));
        setMatches(prev => prev.map(m => ({ ...m, isTied: false, superOverWinner: '' })));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      if (msg.toLowerCase().includes('tied') || msg.toLowerCase().includes('tie')) {
        markMatchTied(parseTiedMatchIndex(msg));
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuperOver = async (matchIdx: number) => {
    setLoading(true);
    setError(null);
    try {
      const batchData = await simulateMatchBatch(buildBatchPayload(matches));
      setResults(batchData.results.map(convertBatchResult));
      setMatches(prev => prev.map(m => ({ ...m, isTied: false, superOverWinner: '' })));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      if (msg.toLowerCase().includes('tied') || msg.toLowerCase().includes('tie')) {
        const newTiedIdx = parseTiedMatchIndex(msg);
        setMatches(prev => prev.map((m, i) => i === newTiedIdx ? { ...m, isTied: true, superOverWinner: '' } : m));
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const result           = results.length > 0 ? results[results.length - 1] : null;
  const summary          = results.map(r => buildPlainEnglishSummary(r, teams)).join(' | ');
  const highlightCodes   = results.flatMap(r => [r.team1, r.team2]);
  const currentStandings = useMemo(() => [...teams].map((t, i) => ({ ...t, position: i + 1 })), [teams]);
  const validMatchCount  = matches.filter(m => m.team1 && m.team2).length;
  const simulateBtnLabel = loading ? 'SIMULATING...' : validMatchCount > 1 ? `SIMULATE ${validMatchCount} MATCHES` : 'SIMULATE MATCH';

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6 space-y-6">
        <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em' }}>
          Match Details
        </h3>

        {!hasTeams ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-12 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Load standings to select teams</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {matches.map((m, idx) => {
              const isOverLimit = m.id === overLimitId;

              return (
                <div
                  key={m.id}
                  ref={el => { matchCardRefs.current.set(m.id, el); }}
                  className={`space-y-4 rounded-lg border p-4 transition-colors ${
                    isOverLimit
                      ? 'border-amber-500/50 bg-amber-500/[0.04]'
                      : m.isTied
                        ? 'border-primary/40 bg-primary/[0.02]'
                        : matches.length > 1
                          ? 'border-gray-200 dark:border-white/10'
                          : 'border-transparent'
                  }`}
                >
                  {/* Match header (always shown so refs align; hide label when only 1 match) */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isOverLimit ? 'text-amber-500' : 'text-primary'
                    } ${matches.length === 1 ? 'invisible' : ''}`}>
                      Match {idx + 1}
                    </span>
                    {matches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMatch(idx)}
                        className="text-xs text-red-400 hover:text-red-600 font-mono transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* ── Max-matches warning banner ── */}
                  {isOverLimit && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {overLimitNames.join(' & ')} {overLimitNames.length > 1 ? 'have' : 'has'} already played the maximum {MAX_MATCHES} matches.
                        </p>
                        <p className="text-xs text-amber-600/75 dark:text-amber-400/70">
                          The IPL league stage allows only {MAX_MATCHES} matches per team. Remove this match or pick a different team to continue.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Team selectors */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Batting First</Label>
                      <Select value={m.team1} onValueChange={v => updateMatch(idx, 'team1', v)}>
                        <SelectTrigger className={`bg-secondary/50 ${isOverLimit ? 'border-amber-500/40' : 'border-white/10'}`}>
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
                        <SelectTrigger className={`bg-secondary/50 ${isOverLimit ? 'border-amber-500/40' : 'border-white/10'}`}>
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

                  {/* Innings inputs */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* 1st innings */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <Label className="text-xs font-mono text-primary uppercase tracking-widest">1st Innings</Label>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="grid gap-3 grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Runs</Label>
                          <Input type="number" min="0" max="400" value={m.team1Runs}
                            onChange={e => updateMatch(idx, 'team1Runs', e.target.value)}
                            placeholder="e.g. 165"
                            className={`bg-secondary/50 font-mono ${!m.team1Runs && runsWarning ? 'border-red-400' : 'border-white/10'}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Overs</Label>
                          <Input type="text" value={m.team1Overs}
                            onChange={e => updateMatch(idx, 'team1Overs', e.target.value)}
                            placeholder="20.0" className="bg-secondary/50 border-white/10 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id={`team1-allout-${idx}`} checked={m.team1AllOut} onCheckedChange={v => updateMatch(idx, 'team1AllOut', v)} />
                        <Label htmlFor={`team1-allout-${idx}`} className="text-xs text-muted-foreground">
                          All Out <span className="text-muted-foreground/60">(counts as full 20 overs)</span>
                        </Label>
                      </div>
                    </div>

                    {/* 2nd innings */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <Label className="text-xs font-mono text-primary uppercase tracking-widest">2nd Innings</Label>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="grid gap-3 grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Runs</Label>
                          <Input type="number" min="0" max="400" value={m.team2Runs}
                            onChange={e => updateMatch(idx, 'team2Runs', e.target.value)}
                            placeholder="e.g. 158"
                            className={`bg-secondary/50 font-mono ${!m.team2Runs && runsWarning ? 'border-red-400' : 'border-white/10'}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Overs Played</Label>
                          <Input type="text" value={m.team2Overs}
                            onChange={e => updateMatch(idx, 'team2Overs', e.target.value)}
                            placeholder="20.0" className="bg-secondary/50 border-white/10 font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id={`team2-allout-${idx}`} checked={m.team2AllOut} onCheckedChange={v => updateMatch(idx, 'team2AllOut', v)} />
                        <Label htmlFor={`team2-allout-${idx}`} className="text-xs text-muted-foreground">
                          All Out <span className="text-muted-foreground/60">(counts as full 20 overs)</span>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Super Over */}
                  {m.isTied && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 mt-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Scores Tied — Super Over
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">This match is tied. Select the Super Over winner to continue.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select value={m.superOverWinner} onValueChange={v => updateMatch(idx, 'superOverWinner', v)}>
                          <SelectTrigger className="bg-secondary/50 border-white/10">
                            <SelectValue placeholder="Select Super Over winner" />
                          </SelectTrigger>
                          <SelectContent>
                            {m.team1 && <SelectItem value={m.team1}>{teams.find(t => (t.code ?? t.team) === m.team1)?.team ?? m.team1}</SelectItem>}
                            {m.team2 && <SelectItem value={m.team2}>{teams.find(t => (t.code ?? t.team) === m.team2)?.team ?? m.team2}</SelectItem>}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          disabled={!m.superOverWinner || loading}
                          className="gap-2 glow-gold font-semibold disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-200"
                          style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
                          onClick={() => handleApplySuperOver(idx)}
                        >
                          APPLY SUPER OVER RESULT
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Runs warning */}
            {runsWarning && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{runsWarning}</span>
              </div>
            )}

            {/* Add Match + Simulate */}
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
                disabled={matches.every(m => !m.team1 || !m.team2) || loading || anyMatchPendingSuperOver}
                className="flex-1 gap-2 glow-gold font-semibold disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-200"
                style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em', fontSize: '0.95rem' }}
              >
                <Calculator className="h-4 w-4" />
                {simulateBtnLabel}
              </Button>
            </div>

            {anyMatchPendingSuperOver && (
              <p className="text-xs text-primary/70 text-center">
                Select a Super Over winner for the tied match above to continue simulating.
              </p>
            )}
          </form>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Standings tables */}
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
          {results.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
              <StandingsTable rows={currentStandings} highlightCodes={highlightCodes} label="Before" labelColor="text-muted-foreground" />
              <div className="hidden lg:flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-primary opacity-60" />
              </div>
              <StandingsTable rows={result!.updated_standings} highlightCodes={highlightCodes} label={`After ${results.length} Match${results.length > 1 ? 'es' : ''}`} labelColor="text-primary" beforeRows={currentStandings} />
            </div>
          ) : (
            <StandingsTable rows={currentStandings} label="Current Points Table" labelColor="text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground/50">▲▼ position change after simulation · Top 4 qualify for playoffs</p>
        </div>
      )}
    </div>
  );
}