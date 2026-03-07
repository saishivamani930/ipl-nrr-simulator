import { useState } from 'react';
import { Target, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChaseMinScoreCalculator } from "@/components/calculators/ChaseMinScoreCalculator";
import { DefendMaxScoreCalculator } from '@/components/calculators/DefendMaxScoreCalculator';
import { ChaseWinMaxBallsCalculator } from '@/components/calculators/ChaseWinMaxBallsCalculator';
import type { Team } from '@/types/api';

interface RequirementsSectionProps {
  teams: Team[];
}

export function RequirementsSection({ teams }: RequirementsSectionProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const hasTeams = teams.length > 0;

  return (
    <section className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Requirements</h1>
            <p className="text-muted-foreground">
              See what your team needs to qualify for playoffs
            </p>
          </div>
        </div>

        {/* Team Selector */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[250px]">
              <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={!hasTeams}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder={hasTeams ? "Select a team" : "Load standings first"} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.team} value={t.team}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {t.team}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={!selectedTeam}
            >
              <Search className="h-4 w-4" />
              Get Requirements
            </Button>
          </div>
        </div>

        {/* Content */}
        {!selectedTeam ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary/50">
              <Target className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Select a Team</h3>
            <p className="max-w-md text-muted-foreground">
              Choose a team above to see their qualification requirements
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* NRR Calculators */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-xl font-semibold text-foreground">
                NRR Threshold Calculators for {selectedTeam}
              </h2>
              
              <Tabs defaultValue="chase-loss" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-secondary">
                  <TabsTrigger 
                    value="chase-loss" 
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                  >
                    Chase & Lose
                  </TabsTrigger>
                  <TabsTrigger 
                    value="defend-win" 
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                  >
                    Defend & Win
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chase-win" 
                    className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                  >
                    Chase & Win
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chase-loss" className="mt-6">
                  <ChaseMinScoreCalculator teams={teams} defaultChaser={selectedTeam} />
                </TabsContent>
                <TabsContent value="defend-win" className="mt-6">
                  <DefendMaxScoreCalculator teams={teams} defaultDefender={selectedTeam} />
                </TabsContent>
                <TabsContent value="chase-win" className="mt-6">
                  <ChaseWinMaxBallsCalculator teams={teams} defaultChaser={selectedTeam} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                For NRR calculations, an all-out innings is treated as the full 20 overs.
                Faster chases improve NRR.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
