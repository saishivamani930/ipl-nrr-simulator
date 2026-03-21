import { useState } from 'react';
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchStandings } from '@/lib/api';
import type { Team } from '@/types/api';

interface StandingsTableProps {
  standings: Team[];
  onStandingsLoad: (standings: Team[]) => void;
}

export function StandingsTable({ standings, onStandingsLoad }: StandingsTableProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStandings(2026);
      onStandingsLoad(data.standings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load standings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-foreground" style={{fontFamily: 'Rajdhani, sans-serif'}}>
            IPL 2026 Standings
          </h3>
          {standings.length > 0 && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {standings.length} teams · Top 4 qualify
            </p>
          )}
        </div>
        <Button
          onClick={handleLoadStandings}
          disabled={loading}
          size="sm"
          className="gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-foreground"
          variant="outline"
          style={{fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em', fontSize: '0.75rem'}}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'LOADING...' : 'REFRESH'}
        </Button>
      </div>

      <div className="p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!error && standings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-secondary/20 py-12 text-center">
            <RefreshCw className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click Refresh to load the current IPL standings
            </p>
          </div>
        )}

        {standings.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-white/5">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/5 bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="w-12 text-center text-xs text-muted-foreground">#</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Team</TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground">M</TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground">W</TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground">L</TableHead>
                  <TableHead className="text-center text-xs text-muted-foreground">Pts</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground">NRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => {
                  const isTopFour = index < 4;
                  const isQualBoundary = index === 3;
                  return (
                    <TableRow
                      key={team.team}
                      className={`border-b transition-colors ${
                        isQualBoundary
                          ? 'border-b-primary/30'
                          : 'border-white/5'
                      } hover:bg-secondary/30`}
                    >
                      <TableCell className="text-center">
                        <span className={`font-mono text-sm font-semibold ${isTopFour ? 'text-primary' : 'text-muted-foreground'}`}>
                          {team.position}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isTopFour && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <span className={`font-semibold text-sm ${isTopFour ? 'text-foreground' : 'text-muted-foreground'}`}
                            style={{fontFamily: 'Rajdhani, sans-serif'}}>
                            {team.team}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">{team.matches}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-green-400">{team.won ?? '—'}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-red-400">{team.lost ?? '—'}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-bold text-sm text-foreground">{team.points}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-xs flex items-center justify-end gap-1 ${team.nrr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {team.nrr >= 0
                            ? <TrendingUp className="h-3 w-3" />
                            : <TrendingDown className="h-3 w-3" />
                          }
                          {team.nrr >= 0 ? '+' : ''}{team.nrr.toFixed(3)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="border-t border-white/5 px-4 py-2.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xs font-mono text-muted-foreground">Top 4 qualify for playoffs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
