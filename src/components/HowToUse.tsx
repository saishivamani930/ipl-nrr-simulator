import { ChevronDown, HelpCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';

export function HowToUse() {
  return (
    <Card>
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-primary" />
            How to Use This Site
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Load Live Standings:</strong> Click
                the "Load Live Standings" button to fetch the current WPL 2026 standings.
                This data populates all team dropdowns.
              </li>
              <li>
                <strong className="text-foreground">Choose a Calculator:</strong> Use the
                NRR Threshold Calculators to determine safe scores for different match
                scenarios:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>
                    <em>Chase & Lose:</em> Minimum score to stay above a rival even in a
                    loss
                  </li>
                  <li>
                    <em>Defend & Win:</em> Maximum opponent score that keeps you above a
                    rival
                  </li>
                  <li>
                    <em>Chase & Win:</em> Slowest safe chase pace to maintain NRR
                    advantage
                  </li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">Monte Carlo Simulation:</strong> Set
                up remaining fixtures and run thousands of simulations to estimate your
                team's qualification probability.
              </li>
              <li>
                <strong className="text-foreground">Read the Results:</strong> Each
                calculator provides clear, explained outcomes showing the NRR-safe
                thresholds for your scenarios.
              </li>
            </ol>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
