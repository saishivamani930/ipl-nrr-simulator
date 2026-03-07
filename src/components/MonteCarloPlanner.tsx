import React, { useState } from "react";
import { Play, Plus, Trash2, AlertCircle, Copy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamSelect } from "@/components/TeamSelect";
import { runMonteCarloSimulation } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Team, Fixture, MonteCarloResult } from "@/types/api";

function fmtPercent(v: unknown, digits = 1, fallback = "—") {
  return typeof v === "number" && Number.isFinite(v) ? (v * 100).toFixed(digits) : fallback;
}

interface MonteCarloPlannerProps {
  teams: Team[];
}

export function MonteCarloPlanner({ teams }: MonteCarloPlannerProps) {
  const [focusTeam, setFocusTeam] = useState("");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [iterations, setIterations] = useState(3000);
  const [confidence, setConfidence] = useState(0.7);
  const [seed, setSeed] = useState("");
  const [useNrr, setUseNrr] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasTeams = teams.length > 0;

  const addFixture = () => {
    setFixtures((prev) => [...prev, { team1: "", team2: "", batting_first: "toss" }]);
  };

  const removeFixture = (index: number) => {
    setFixtures((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ No "any" — typed properly
  const updateFixture = <K extends keyof Fixture>(
    index: number,
    field: K,
    value: Fixture[K]
  ) => {
    setFixtures((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTeam || fixtures.some((f) => !f.team1 || !f.team2)) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestData = {
        focus_team: focusTeam,
        fixtures,
        iterations,
        confidence,
        ...(seed ? { seed: parseInt(seed, 10) } : {}),
        use_nrr: useNrr,
      };

      const data = await runMonteCarloSimulation(requestData);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyRequestJson = () => {
    const requestData = {
      focus_team: focusTeam,
      fixtures,
      iterations,
      confidence,
      ...(seed ? { seed: parseInt(seed, 10) } : {}),
      use_nrr: useNrr,
    };
    navigator.clipboard.writeText(JSON.stringify(requestData, null, 2));
    toast({ title: "Copied!", description: "Request JSON copied to clipboard" });
  };

  const isFormValid =
    !!focusTeam &&
    fixtures.length > 0 &&
    fixtures.every((f) => f.team1 && f.team2 && f.team1 !== f.team2);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Panel */}
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-6 text-lg font-semibold text-foreground">Simulation Settings</h3>

          {!hasTeams ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">Load standings to configure simulation</p>
            </div>
          ) : (
            <div className="space-y-6">
              <TeamSelect
                label="Focus Team"
                value={focusTeam}
                onChange={setFocusTeam}
                teams={teams}
              />

              <div className="space-y-3">
                <Label className="text-sm text-foreground">
                  Iterations: {iterations.toLocaleString()}
                </Label>
                <Slider
                  value={[iterations]}
                  onValueChange={([v]) => setIterations(v)}
                  min={100}
                  max={20000}
                  step={100}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100</span>
                  <span>20,000</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-foreground">
                  Confidence: {Math.round(confidence * 100)}%
                </Label>
                <Slider
                  value={[confidence * 100]}
                  onValueChange={([v]) => setConfidence(v / 100)}
                  min={50}
                  max={99}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Seed (Optional)</Label>
                <Input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="bg-secondary/50"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Use NRR in calculations</Label>
                <Switch checked={useNrr} onCheckedChange={setUseNrr} />
              </div>
            </div>
          )}
        </div>

        {/* Fixtures */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Remaining Fixtures</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addFixture}
              disabled={!hasTeams}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Fixture
            </Button>
          </div>

          {fixtures.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
              <p className="mb-3 text-sm text-muted-foreground">No fixtures added yet</p>
              <Button
                variant="default"
                size="sm"
                onClick={addFixture}
                disabled={!hasTeams}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Your First Fixture
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {fixtures.map((fixture, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-xs text-muted-foreground">Team 1</Label>
                    <Select
                      value={fixture.team1}
                      onValueChange={(v) => updateFixture(index, "team1", v)}
                    >
                      <SelectTrigger className="mt-1 bg-secondary/50">
                        <SelectValue placeholder="Team 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams
                          .filter((t) => t.team !== fixture.team2)
                          .map((t) => (
                            <SelectItem key={t.team} value={t.team}>
                              {t.team}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-xs text-muted-foreground">Team 2</Label>
                    <Select
                      value={fixture.team2}
                      onValueChange={(v) => updateFixture(index, "team2", v)}
                    >
                      <SelectTrigger className="mt-1 bg-secondary/50">
                        <SelectValue placeholder="Team 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams
                          .filter((t) => t.team !== fixture.team1)
                          .map((t) => (
                            <SelectItem key={t.team} value={t.team}>
                              {t.team}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-xs text-muted-foreground">Bats First</Label>
                    <Select
                      value={fixture.batting_first}
                      onValueChange={(v) =>
                        updateFixture(index, "batting_first", v as Fixture["batting_first"])
                      }
                    >
                      <SelectTrigger className="mt-1 bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team1">Team 1</SelectItem>
                        <SelectItem value="team2">Team 2</SelectItem>
                        <SelectItem value="toss">Toss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFixture(index)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={handleSubmit} disabled={!isFormValid || loading} className="w-full gap-2">
            <Play className="h-4 w-4" />
            {loading ? "Running Simulation..." : "Run Monte Carlo"}
          </Button>

          <Button
            variant="outline"
            onClick={copyRequestJson}
            disabled={!focusTeam}
            className="w-full gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Request JSON
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6">
        {!result ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary/50">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No Simulation Results</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add fixtures and run Monte Carlo simulation to see qualification probabilities
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ✅ Summary cards REMOVED as requested */}

            {Array.isArray(result.results) && result.results.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead className="text-muted-foreground">Scenario</TableHead>
                      <TableHead className="text-right text-muted-foreground">Probability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((r, i) => (
                      <TableRow key={i} className="hover:bg-secondary/30">
                        <TableCell className="text-foreground">{r.scenario}</TableCell>
                        <TableCell className="text-right font-mono text-foreground">
                          {fmtPercent(r.probability, 1)}
                          {typeof r.probability === "number" ? "%" : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {(!Array.isArray(result.results) || result.results.length === 0) && (
              <div className="text-sm text-muted-foreground">
                No scenario probabilities returned from backend.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
