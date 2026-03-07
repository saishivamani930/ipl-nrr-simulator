import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandingsTable } from '@/components/StandingsTable';
import { HowToUse } from '@/components/HowToUse';
import type { Team } from '@/types/api';

interface StandingsSectionProps {
  teams: Team[];
  onTeamsLoad: (teams: Team[]) => void;
  onBack: () => void;
}

export function StandingsSection({ teams, onTeamsLoad, onBack }: StandingsSectionProps) {
  return (
    <section className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Live Standings</h2>
            <p className="mt-2 text-muted-foreground">
              Current WPL 2026 standings with NRR data
            </p>
          </div>
          
          <StandingsTable standings={teams} onStandingsLoad={onTeamsLoad} />
          
          <HowToUse />
        </div>
      </div>
    </section>
  );
}
