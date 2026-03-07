import { Calculator } from 'lucide-react';
import { MatchSimulator } from '@/components/MatchSimulator';
import type { Team } from '@/types/api';

interface SimulateSectionProps {
  teams: Team[];
}

export function SimulateSection({ teams }: SimulateSectionProps) {
  return (
    <section className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Match Simulator</h1>
            <p className="text-muted-foreground">
              Simulate a match result and see how it affects the points table and NRR
            </p>
          </div>
        </div>

        <MatchSimulator teams={teams} />
      </div>
    </section>
  );
}
