import { Activity } from 'lucide-react';
import { MatchSimulator } from '@/components/MatchSimulator';
import type { Team } from '@/types/api';

interface SimulateSectionProps {
  teams: Team[];
}

export function SimulateSection({ teams }: SimulateSectionProps) {
  return (
    <section className="min-h-screen pt-14 bg-white dark:bg-[hsl(222,47%,8%)]">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{fontFamily: 'Rajdhani, sans-serif'}}>
              Match Simulator
            </h1>
            <p className="text-sm text-muted-foreground">
              Simulate a match result and see how it affects the points table and NRR
            </p>
          </div>
        </div>

        <MatchSimulator teams={teams} />
      </div>
    </section>
  );
}
