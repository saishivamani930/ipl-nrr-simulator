import { BarChart3, ChevronDown } from 'lucide-react';
import { useRef } from 'react';
import { MonteCarloPlanner } from '@/components/MonteCarloPlanner';
import type { Team } from '@/types/api';

interface PlannerSectionProps {
  teams: Team[];
}

export function PlannerSection({ teams }: PlannerSectionProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  return (
    <section className="min-h-screen pt-14 bg-white dark:bg-[hsl(222,47%,8%)] relative">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{fontFamily: 'Rajdhani, sans-serif'}}>
              Monte Carlo Planner
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter remaining fixtures to simulate thousands of season outcomes
            </p>
          </div>
        </div>

        <MonteCarloPlanner teams={teams} />
      <div ref={bottomRef} />
      </div>

      <button
        onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary shadow-lg hover:bg-primary/20 transition-colors"
        aria-label="Scroll to bottom"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </section>
  );
}
