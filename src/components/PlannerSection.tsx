import { BarChart3 } from 'lucide-react';
import { MonteCarloPlanner } from '@/components/MonteCarloPlanner';
import type { Team } from '@/types/api';

interface PlannerSectionProps {
  teams: Team[];
}

export function PlannerSection({ teams }: PlannerSectionProps) {
  return (
    <section className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Monte Carlo Planner</h1>
            <p className="text-muted-foreground">
              Enter remaining fixtures to simulate thousands of season outcomes
            </p>
          </div>
        </div>

        <MonteCarloPlanner teams={teams} />
      </div>
    </section>
  );
}
