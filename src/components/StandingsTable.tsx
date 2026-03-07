import { useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium text-foreground">WPL 2026 Standings</CardTitle>
        <Button
          onClick={handleLoadStandings}
          disabled={loading}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Load Live Standings'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!error && standings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 py-12 text-center">
            <RefreshCw className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Click "Load Live Standings" to fetch the current WPL standings
            </p>
          </div>
        )}

        {standings.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="w-16 text-center text-muted-foreground">Pos</TableHead>
                  <TableHead className="text-muted-foreground">Team</TableHead>
                  <TableHead className="text-center text-muted-foreground">Matches</TableHead>
                  <TableHead className="text-center text-muted-foreground">Points</TableHead>
                  <TableHead className="text-right text-muted-foreground">NRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team, index) => (
                  <TableRow key={team.team} className="border-b border-border hover:bg-secondary/30">
                    <TableCell className="text-center font-medium text-foreground">
                      <span className={index < 4 ? 'text-primary' : ''}>{team.position}</span>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{team.team}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{team.matches}</TableCell>
                    <TableCell className="text-center font-semibold text-foreground">
                      {team.points}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        team.nrr >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {team.nrr >= 0 ? '+' : ''}
                      {team.nrr.toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
