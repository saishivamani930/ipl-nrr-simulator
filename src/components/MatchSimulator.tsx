import { useMemo, useState } from 'react';
import { Calculator, AlertCircle } from 'lucide-react';
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

function teamCode(t: Team): string {
  return t.code ?? t.team; // fallback only if code missing
}

export function MatchSimulator({ teams=[] }: MatchSimulatorProps) {
  // store selected values as TEAM CODES (RCB-W, MI-W, etc.)
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  const [team1Runs, setTeam1Runs] = useState('0');
  const [team1Overs, setTeam1Overs] = useState('20.0');
  const [team1AllOut, setTeam1AllOut] = useState(false);

  const [team2Runs, setTeam2Runs] = useState('0');
  const [team2Overs, setTeam2Overs] = useState('20.0');
  const [team2AllOut, setTeam2AllOut] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchSimulateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasTeams = teams.length > 0;
  const isFormValid = team1 && team2 && team1 !== team2;

  // map code -> full Team (so we can display full name in results even if backend returns code)
  const teamByCode = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(teamCode(t), t);
    return m;
  }, [teams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1 || !team2) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await simulateMatch({
        team1, // code like "RCB-W"
        team2, // code like "MI-W"
        team1_runs: parseInt(team1Runs, 10) || 0,
        team1_overs: team1Overs,
        team1_all_out: team1AllOut,
        team2_runs: parseInt(team2Runs, 10) || 0,
        team2_overs: team2Overs,
        team2_all_out: team2AllOut,
      });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const displayTeamName = (row: Team): string => {
    // if backend returns code in row.team, map it to full name
    const maybeCode = row.code ?? row.team;
    return teamByCode.get(maybeCode)?.team ?? row.team;
  };

  const isMatchRow = (row: Team): boolean => {
    if (!result) return false;
    const rowCode = row.code ?? row.team;
    return rowCode === result.team1 || rowCode === result.team2;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Panel - Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Match Details</h3>

        {!hasTeams ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Load standings to select teams</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Team 1 (Bats First)</Label>
                <Select value={team1} onValueChange={setTeam1}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter((t) => teamCode(t) !== team2)
                      .map((t) => (
                        <SelectItem key={teamCode(t)} value={teamCode(t)}>
                          {t.team}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Team 2 (Chases)</Label>
                <Select value={team2} onValueChange={setTeam2}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter((t) => teamCode(t) !== team1)
                      .map((t) => (
                        <SelectItem key={teamCode(t)} value={teamCode(t)}>
                          {t.team}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 1st Innings */}
            <div className="space-y-3">
              <Label className="text-sm text-primary">1st Innings</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Runs</Label>
                  <Input
                    type="number"
                    min="0"
                    max="400"
                    value={team1Runs}
                    onChange={(e) => setTeam1Runs(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Overs</Label>
                  <Input
                    type="text"
                    value={team1Overs}
                    onChange={(e) => setTeam1Overs(e.target.value)}
                    placeholder="20.0"
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="team1-allout"
                  checked={team1AllOut}
                  onCheckedChange={setTeam1AllOut}
                />
                <Label htmlFor="team1-allout" className="text-sm text-muted-foreground">
                  All Out
                </Label>
              </div>
            </div>

            {/* 2nd Innings */}
            <div className="space-y-3">
              <Label className="text-sm text-primary">2nd Innings</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Runs</Label>
                  <Input
                    type="number"
                    min="0"
                    max="400"
                    value={team2Runs}
                    onChange={(e) => setTeam2Runs(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Overs</Label>
                  <Input
                    type="text"
                    value={team2Overs}
                    onChange={(e) => setTeam2Overs(e.target.value)}
                    placeholder="20.0"
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="team2-allout"
                  checked={team2AllOut}
                  onCheckedChange={setTeam2AllOut}
                />
                <Label htmlFor="team2-allout" className="text-sm text-muted-foreground">
                  All Out
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={!isFormValid || loading} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              {loading ? 'Simulating...' : 'Simulate Match'}
            </Button>
          </form>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6">
        {!result ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary/50">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No Simulation Yet</h3>
            <p className="text-sm text-muted-foreground">
              Enter match details and click simulate to see results
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-lg font-semibold text-primary">{result.result_description}</p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead className="w-12 text-center text-muted-foreground">Pos</TableHead>
                    <TableHead className="text-muted-foreground">Team</TableHead>
                    <TableHead className="text-center text-muted-foreground">M</TableHead>
                    <TableHead className="text-center text-muted-foreground">Pts</TableHead>
                    <TableHead className="text-right text-muted-foreground">NRR</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {result.updated_standings.map((t, idx) => {
                    const matchRow = isMatchRow(t);
                    const key = `${t.code ?? t.team}-${idx}`;

                    return (
                      <TableRow
                        key={key}
                        className={`hover:bg-secondary/30 ${matchRow ? 'bg-primary/5' : ''}`}
                      >
                        <TableCell className="text-center">
                          <span className={idx < 4 ? 'text-primary font-medium' : ''}>
                            {t.position}
                          </span>
                        </TableCell>

                        <TableCell className={`font-medium ${matchRow ? 'text-primary' : 'text-foreground'}`}>
                          {displayTeamName(t)}
                        </TableCell>

                        <TableCell className="text-center text-muted-foreground">{t.matches}</TableCell>

                        <TableCell className="text-center font-semibold text-foreground">{t.points}</TableCell>

                        <TableCell className={`text-right font-mono ${t.nrr >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {t.nrr >= 0 ? '+' : ''}
                          {t.nrr.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
