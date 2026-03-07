import { Info, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChaseMinScoreCalculator } from '@/components/calculators/ChaseMinScoreCalculator';
import { DefendMaxScoreCalculator } from '@/components/calculators/DefendMaxScoreCalculator';
import { ChaseWinMaxBallsCalculator } from '@/components/calculators/ChaseWinMaxBallsCalculator';
import type { Team } from '@/types/api';

interface NRRCalculatorsProps {
  teams: Team[];
}

export function NRRCalculators({ teams }: NRRCalculatorsProps) {
  const hasTeams = teams.length > 0;

  if (!hasTeams) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 p-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-primary" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Load Standings First</h3>
        <p className="text-muted-foreground">
          Please load the live standings from the Standings page to use the calculators
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="chase-loss" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="chase-loss" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
            Chase & Lose
          </TabsTrigger>
          <TabsTrigger value="defend-win" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
            Defend & Win
          </TabsTrigger>
          <TabsTrigger value="chase-win" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm">
            Chase & Win
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chase-loss" className="mt-6">
          <ChaseMinScoreCalculator teams={teams} />
        </TabsContent>
        <TabsContent value="defend-win" className="mt-6">
          <DefendMaxScoreCalculator teams={teams} />
        </TabsContent>
        <TabsContent value="chase-win" className="mt-6">
          <ChaseWinMaxBallsCalculator teams={teams} />
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-muted-foreground">
          For NRR calculations, an all-out innings is treated as the full 20 overs.
          Faster chases improve NRR.
        </p>
      </div>
    </div>
  );
}
