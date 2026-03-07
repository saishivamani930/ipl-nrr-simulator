import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              WPL NRR Scenario Simulator
            </h1>
            <p className="text-sm text-muted-foreground">
              Understand qualification scenarios using NRR
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
