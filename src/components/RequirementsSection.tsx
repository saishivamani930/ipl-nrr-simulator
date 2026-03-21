import { useState } from 'react';
import { Target, Search, AlertCircle, Shield, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChaseMinScoreCalculator } from "@/components/calculators/ChaseMinScoreCalculator";
import { DefendMaxScoreCalculator } from '@/components/calculators/DefendMaxScoreCalculator';
import { ChaseWinMaxBallsCalculator } from '@/components/calculators/ChaseWinMaxBallsCalculator';
import type { Team } from '@/types/api';

interface RequirementsSectionProps {
  teams: Team[];
}

type BattingMode = 'batting-first' | 'batting-second';
type ScenarioMode = 'win' | 'lose';

export function RequirementsSection({ teams }: RequirementsSectionProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [battingMode, setBattingMode] = useState<BattingMode>('batting-first');
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>('win');
  const hasTeams = teams.length > 0;

  // Determine which calculator to show based on batting mode + scenario
  // batting-first + win   => DefendMaxScoreCalculator (defending and winning)
  // batting-first + lose  => DefendMaxScoreCalculator (defending and losing — not currently a calculator, show message)
  // batting-second + win  => ChaseWinMaxBallsCalculator (chasing and winning)
  // batting-second + lose => ChaseMinScoreCalculator (chasing and losing)

  const showDefendWin = battingMode === 'batting-first' && scenarioMode === 'win';
  const showChaseWin = battingMode === 'batting-second' && scenarioMode === 'win';
  const showChaseLose = battingMode === 'batting-second' && scenarioMode === 'lose';
  const showDefendLose = battingMode === 'batting-first' && scenarioMode === 'lose';

  const getPurposeText = () => {
    if (showDefendWin) return "My team bats first and wins. What's the maximum score the opponent can make for us to stay above a rival on NRR?";
    if (showChaseWin) return "My team bats second and wins. How slowly can we chase and still stay above a rival on NRR?";
    if (showChaseLose) return "My team bats second and loses. What's the minimum score we must reach to stay above a rival on NRR?";
    if (showDefendLose) return "My team bats first and loses. NRR damage depends on how quickly the opponent chases — use the Chase & Win calculator from their perspective.";
    return "";
  };

  return (
    <section className="min-h-screen pt-14 bg-white dark:bg-[hsl(222,47%,8%)]">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{fontFamily: 'Rajdhani, sans-serif'}}>
              Team Requirements
            </h1>
            <p className="text-sm text-muted-foreground">
              See what your team needs to qualify for playoffs
            </p>
          </div>
        </div>

        {/* Team Selector */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[250px]">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                Select Team
              </p>
              <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={!hasTeams}>
                <SelectTrigger className="bg-secondary/50 border-white/10">
                  <SelectValue placeholder={hasTeams ? "Choose your team" : "Load standings first"} />
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
              className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
              disabled={!selectedTeam}
              style={{fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em'}}
            >
              <Search className="h-4 w-4" />
              GET REQUIREMENTS
            </Button>
          </div>
        </div>

        {/* Content */}
        {!selectedTeam ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-card py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-secondary/50">
              <Target className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground" style={{fontFamily: 'Rajdhani, sans-serif'}}>
              Select a Team
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Choose a team above to calculate their qualification requirements
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in" style={{animationDelay: '0s', opacity: 0}}>
            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6">
              <h2 className="mb-6 text-xl font-bold text-foreground" style={{fontFamily: 'Rajdhani, sans-serif'}}>
                NRR Requirements for{' '}
                <span className="text-primary">{selectedTeam}</span>
              </h2>

              {/* Step 1: Batting Mode */}
              <div className="mb-6">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                  Step 1 — Tonight, my team is...
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBattingMode('batting-first')}
                    className={`relative flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                      battingMode === 'batting-first'
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-white/5 bg-secondary/30 text-muted-foreground hover:border-white/10 hover:text-foreground'
                    }`}
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm" style={{fontFamily: 'Rajdhani, sans-serif'}}>
                        Batting First
                      </p>
                      <p className="text-xs opacity-70">Setting a target</p>
                    </div>
                    {battingMode === 'batting-first' && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>

                  <button
                    onClick={() => setBattingMode('batting-second')}
                    className={`relative flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                      battingMode === 'batting-second'
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-white/5 bg-secondary/30 text-muted-foreground hover:border-white/10 hover:text-foreground'
                    }`}
                  >
                    <Swords className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm" style={{fontFamily: 'Rajdhani, sans-serif'}}>
                        Batting Second
                      </p>
                      <p className="text-xs opacity-70">Chasing a target</p>
                    </div>
                    {battingMode === 'batting-second' && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Outcome */}
              <div className="mb-6">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                  Step 2 — The result will be...
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setScenarioMode('win')}
                    className={`relative flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-bold transition-all ${
                      scenarioMode === 'win'
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-white/5 bg-secondary/30 text-foreground/70 hover:border-white/10 hover:text-foreground'
                    }`}
                    style={{fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em', fontWeight: 700}}
                  >
                    WIN
                  </button>
                  <button
                    onClick={() => setScenarioMode('lose')}
                    className={`relative flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-bold transition-all ${
                      scenarioMode === 'lose'
                        ? 'border-red-500/40 bg-red-500/10 text-red-400'
                        : 'border-white/5 bg-secondary/30 text-foreground/70 hover:border-white/10 hover:text-foreground'
                    }`}
                    style={{fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em'}}
                  >
                    LOSE
                  </button>
                </div>
              </div>

              {/* Purpose text */}
              <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-medium">Purpose: </span>
                  {getPurposeText()}
                </p>
              </div>

              {/* Calculator */}
              {showDefendWin && (
                <DefendMaxScoreCalculator key={`defend-win-${selectedTeam}`} teams={teams} defaultDefender={selectedTeam} />
              )}
              {showChaseWin && (
                <ChaseWinMaxBallsCalculator key={`chase-win-${selectedTeam}`} teams={teams} defaultChaser={selectedTeam} />
              )}
              {showChaseLose && (
                <ChaseMinScoreCalculator key={`chase-lose-${selectedTeam}`} teams={teams} defaultChaser={selectedTeam} />
              )}
              {showDefendLose && (
                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When your team bats first and loses, your NRR damage is determined by how quickly
                    the opponent chases. To analyze this scenario, use the <strong className="text-foreground">Chase & Win</strong> calculator
                    from the opponent's perspective — their fastest safe chase is your worst case.
                  </p>
                </div>
              )}
            </div>

            {/* Info Note */}
            <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-secondary/20 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                For NRR calculations, an all-out innings is treated as the full 20 overs.
                Faster chases improve NRR. Slower chases reduce NRR damage in a loss.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
