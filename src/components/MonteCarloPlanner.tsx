import React, { useState, useEffect, useRef } from "react";
import { Play, Plus, Trash2, AlertCircle, RefreshCw, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { runMonteCarloSimulation, fetchFixtures } from "@/lib/api";
import type { EspnFixture } from "@/lib/api";
import type { Team, Fixture, MonteCarloResult } from "@/types/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function getBarColor(p: number): string {
  if (p >= 0.7) return "hsl(38 95% 54%)";
  if (p >= 0.4) return "hsl(213 90% 55%)";
  return "hsl(0 72% 51%)";
}

function buildHeadline(focusTeam: string, p: number): string {
  const pct = (p * 100).toFixed(1);
  if (p >= 0.9) return `${focusTeam} qualifies in ${pct}% of simulated seasons — looking very safe.`;
  if (p >= 0.6) return `${focusTeam} qualifies in ${pct}% of simulated seasons — in contention.`;
  if (p >= 0.3) return `${focusTeam} qualifies in ${pct}% of simulated seasons — needs results to go their way.`;
  return `${focusTeam} qualifies in only ${pct}% of simulated seasons — in serious trouble.`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div
        className="rounded-lg border border-white/10 bg-card px-3 py-2 shadow-xl pointer-events-none"
        style={{ transform: "translateY(-110%)" }}
      >
        <p className="text-xs font-mono text-muted-foreground">{d.scenario}</p>
        <p className="text-lg font-bold text-primary font-mono">{(d.probability * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

function formatMatchDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function toInputDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

// Generate TBD placeholder fixtures from match 21 to 50
// No dates — schedule not released yet, just match numbers
function generateTbdFixtures(startAfterIndex: number, count: number): EspnFixture[] {
  const placeholders: EspnFixture[] = [];
  for (let i = 0; i < count; i++) {
    const matchNum = startAfterIndex + i + 1;
    placeholders.push({
      match_id: `tbd-${matchNum}`,
      date: "",
      team1: "",
      team2: "",
      team1_code: "",
      team2_code: "",
      status: "upcoming",
      venue: null,
      _isTbd: true,
      _matchNum: matchNum,
    } as any);
  }
  return placeholders;
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
  const [showModal, setShowModal] = useState(false);

  const [espnFixtures, setEspnFixtures] = useState<EspnFixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesError, setFixturesError] = useState<string | null>(null);

  // Highlighted fixture match_ids (for visual selection)
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Date range filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Show TBD fixtures beyond released schedule
  const [showTbd, setShowTbd] = useState(false);

  const [allAdded, setAllAdded] = useState(false);

  const fixtureListRef = useRef<HTMLDivElement>(null);
  const hasTeams = teams.length > 0;

  useEffect(() => {
    loadEspnFixtures();
    const interval = setInterval(() => { loadEspnFixtures(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadEspnFixtures() {
    setFixturesLoading(true);
    setFixturesError(null);
    try {
      const data = await fetchFixtures(2026);
      setEspnFixtures(data);
    } catch {
      setFixturesError("Could not load fixtures from ESPN. Add manually below.");
    } finally {
      setFixturesLoading(false);
    }
  }

  // Real upcoming fixtures sorted by date
  const filteredEspnFixtures = [...espnFixtures]
    .filter(f => f.status !== "completed")
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  // TBD placeholders (fixtures 21–50)
  const tbdFixtures = generateTbdFixtures(filteredEspnFixtures.length, 50);

  // All fixtures shown in the list (real + TBD if enabled)
  const allDisplayFixtures: (EspnFixture & { _isTbd?: boolean; _matchNum?: number })[] =
    showTbd ? [...filteredEspnFixtures, ...tbdFixtures] : filteredEspnFixtures;

  // Apply date range filter
  const dateFilteredFixtures = allDisplayFixtures.filter(f => {
    if (!f.date) return true;
    const fDate = toInputDate(f.date);
    if (dateFrom && fDate < dateFrom) return false;
    if (dateTo && fDate > dateTo) return false;
    return true;
  });

  function toggleHighlight(matchId: string) {
    setHighlightedIds(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  }

  function handleFixtureClick(idx: number, f: EspnFixture & { _isTbd?: boolean }) {
    const isTbd = !!(f as any)._isTbd;
    const isReal = !isTbd && f.team1 && f.team2;

    // Compute ONCE before any state update
    const alreadyAllHighlighted =
      dateFilteredFixtures.slice(0, idx + 1).every(fix => highlightedIds.has(fix.match_id)) &&
      dateFilteredFixtures.slice(idx + 1).every(fix => !highlightedIds.has(fix.match_id));

    // Update highlights
    setHighlightedIds(prev => {
      const next = new Set(prev);
      if (alreadyAllHighlighted) {
        // Deselect everything
        for (let i = 0; i < dateFilteredFixtures.length; i++) {
          next.delete(dateFilteredFixtures[i].match_id);
        }
      } else {
        // Set range to exactly 0..idx
        for (let i = 0; i < dateFilteredFixtures.length; i++) {
          if (i <= idx) next.add(dateFilteredFixtures[i].match_id);
          else next.delete(dateFilteredFixtures[i].match_id);
        }
      }
      return next;
    });

    // Update selected fixtures using same decision
    if (isReal) {
      if (alreadyAllHighlighted) {
        setFixtures([]);
      } else {
        const toAdd: Fixture[] = [];
        for (let i = 0; i <= idx; i++) {
          const fix = dateFilteredFixtures[i];
          if ((fix as any)._isTbd || !fix.team1 || !fix.team2) continue;
          toAdd.push({ team1: fix.team1, team2: fix.team2, batting_first: "toss" });
        }
        setFixtures(toAdd);
      }
    }
  }

  function addAllUpcoming() {
  const toAdd = filteredEspnFixtures
    .map(f => ({ team1: f.team1, team2: f.team2, batting_first: "toss" as const }))
    .filter(f => f.team1 && f.team2);
  setFixtures(prev => [...prev, ...toAdd]);
  setAllAdded(true);
}

  function addDateRangeFixtures() {
    const toAdd = dateFilteredFixtures
      .filter(f => !(f as any)._isTbd && f.team1 && f.team2)
      .map(f => ({ team1: f.team1, team2: f.team2, batting_first: "toss" as const }));
    if (toAdd.length === 0) return;
    setFixtures(prev => [...prev, ...toAdd]);
  }

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
  }

  const hasDateFilter = dateFrom || dateTo;

  const addFixture = () => setFixtures(prev => [...prev, { team1: "", team2: "", batting_first: "toss" }]);
  const removeFixture = (i: number) => setFixtures(prev => prev.filter((_, idx) => idx !== i));
  const updateFixture = <K extends keyof Fixture>(i: number, field: K, value: Fixture[K]) => {
    setFixtures(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusTeam || fixtures.some(f => !f.team1 || !f.team2)) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runMonteCarloSimulation({
        focus_team: focusTeam,
        fixtures,
        iterations,
        confidence,
        ...(seed ? { seed: parseInt(seed, 10) } : {}),
        use_nrr: useNrr,
      });
      setResult(data);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    !!focusTeam &&
    fixtures.length > 0 &&
    fixtures.every(f => f.team1 && f.team2 && f.team1 !== f.team2);

  const raw = result as any;
  const chartData = (raw?.results ?? [])
    .map((r: any) => ({
      scenario: r.scenario.replace(/^Top-4:\s*/i, ""),
      probability: r.probability as number,
    }))
    .sort((a: any, b: any) => b.probability - a.probability);

  const focusTeamCode: string = teams.find(t => t.team === focusTeam)?.code ?? focusTeam;
  const focusEntry = chartData.find((d: any) => d.scenario === focusTeamCode || d.scenario === focusTeam);
  const focusProb: number | undefined = focusEntry?.probability;
  const headline = focusProb !== undefined && focusTeam ? buildHeadline(focusTeam, focusProb) : "";

  return (
    <>
      <div className="space-y-5">
        {/* Simulation Settings */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6">
        <h3 className="mb-5 text-lg font-bold text-foreground" style={{ fontFamily: "Rajdhani,sans-serif" }}>
          Simulation Settings
          </h3>

          {!hasTeams ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-10 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Load standings to configure simulation</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Focus Team</Label>
                <Select value={focusTeam} onValueChange={setFocusTeam}>
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue placeholder="Select focus team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.team} value={team.team}>{team.team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Iterations: <span className="text-primary">{iterations.toLocaleString()}</span>
                </Label>
                <Slider value={[iterations]} onValueChange={([v]) => setIterations(v)} min={100} max={20000} step={100} className="py-1" />
                <div className="flex justify-between text-xs font-mono text-muted-foreground/50">
                  <span>100</span><span>20,000</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Confidence: <span className="text-primary">{Math.round(confidence * 100)}%</span>
                </Label>
                <Slider value={[confidence * 100]} onValueChange={([v]) => setConfidence(v / 100)} min={50} max={99} step={1} className="py-1" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Seed (Optional)</Label>
                  <Input
                    type="text"
                    value={seed}
                    onChange={e => setSeed(e.target.value)}
                    placeholder="Random"
                    className="bg-secondary/50 border-white/10 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-3 py-2">
                  <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Use NRR</Label>
                  <Switch checked={useNrr} onCheckedChange={setUseNrr} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixtures Panel */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6">
          {/* Header row */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "Rajdhani,sans-serif" }}>
                Upcoming Fixtures
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                From ESPNcricinfo — completed matches are removed automatically
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEspnFixtures}
              disabled={fixturesLoading}
              className="gap-1.5 border-gray-300 bg-white hover:bg-gray-50 text-xs dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fixturesLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Toolbar: date filter + TBD toggle */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {/* Date filter toggle */}
            <button
              onClick={() => setShowDateFilter(v => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
                hasDateFilter
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-gray-300 bg-white text-muted-foreground hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {hasDateFilter ? "Filter active" : "Date range"}
              <ChevronDown className={`h-3 w-3 transition-transform ${showDateFilter ? "rotate-180" : ""}`} />
            </button>

            {/* TBD toggle */}
            <button
              onClick={() => setShowTbd(v => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
                showTbd
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-gray-300 bg-white text-muted-foreground hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              {showTbd ? "Hide TBD (21–70)" : "Show TBD (21–70)"}
            </button>

            {hasDateFilter && (
              <button
                onClick={clearDateFilter}
                className="text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Date range inputs */}
          {showDateFilter && (
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-secondary/20 p-3">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-secondary/50 border-white/10 font-mono text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-secondary/50 border-white/10 font-mono text-xs h-8"
                />
              </div>
              {hasDateFilter && (
                <div className="col-span-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDateRangeFixtures}
                    className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add All in Date Range ({dateFilteredFixtures.filter(f => !(f as any)._isTbd && f.team1 && f.team2).length} fixtures)
                  </Button>
                </div>
              )}
            </div>
          )}

          {fixturesError && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {fixturesError}
            </div>
          )}

          {fixturesLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading fixtures...
            </div>
          ) : dateFilteredFixtures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fixtures match the selected date range.
            </p>
          ) : (
            <div
              ref={fixtureListRef}
              className="space-y-2 max-h-[480px] overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(38 95% 38% / 0.3) transparent" }}
            >
              {dateFilteredFixtures.map((f, idx) => {
                const isTbd = !!(f as any)._isTbd;
                const matchNum = (f as any)._matchNum;
                const isHighlighted = highlightedIds.has(f.match_id);
                const isReal = !isTbd && f.team1 && f.team2;

                return (
                  <div
                    key={f.match_id}
                    onClick={() => handleFixtureClick(idx, f as any)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all cursor-pointer ${
                      isHighlighted
                        ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_hsl(38_95%_54%/0.3)]"
                        : isTbd
                        ? "border-white/5 bg-secondary/20 opacity-60 hover:opacity-80 hover:bg-secondary/30"
                        : "border-white/5 bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Match number badge */}
                      <span className={`flex-shrink-0 text-[10px] font-mono rounded px-1.5 py-0.5 ${
                        isTbd
                          ? "bg-white/5 text-muted-foreground/50"
                          : "bg-primary/10 text-primary/70"
                      }`}>
                        M{isTbd ? matchNum : idx + 1}
                      </span>

                      <div className="min-w-0">
                        {isTbd ? (
                          <p className="text-sm font-semibold text-muted-foreground/50 italic" style={{ fontFamily: "Rajdhani,sans-serif" }}>
                            TBD vs TBD
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "Rajdhani,sans-serif" }}>
                            {f.team1} <span className="text-muted-foreground font-normal">vs</span> {f.team2}
                          </p>
                        )}
                        {!isTbd && f.date && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {formatMatchDate(f.date)}
                            {f.venue ? ` · ${f.venue}` : ""}
                          </p>
                        )}
                        {isTbd && (
                          <p className="text-xs font-mono text-muted-foreground/40">Schedule not yet released</p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      {isHighlighted ? (
                        <span className="text-xs text-primary font-mono font-bold">✓ Added</span>
                      ) : isTbd ? (
                        <span className="text-xs text-muted-foreground/40 font-mono">TBD</span>
                      ) : (
                        <span className="text-xs text-primary font-mono">+ Add</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom action buttons */}
          {!fixturesLoading && filteredEspnFixtures.length > 1 && (
            <div className="mt-3 space-y-2">
              {!hasDateFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAllUpcoming}
                  disabled={allAdded}
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {allAdded
                    ? `✓ Added All ${filteredEspnFixtures.length} Fixtures`
                    : `Add All ${filteredEspnFixtures.length} Fixtures`}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Selected Fixtures */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "Rajdhani,sans-serif" }}>
              Selected Fixtures
              <span className="font-mono text-sm text-muted-foreground">({fixtures.length})</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addFixture}
              disabled={!hasTeams}
              className="gap-1 border-white/10 bg-white/5 hover:bg-white/10 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Manual
            </Button>
          </div>

          {fixtures.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-6 text-center">
              <p className="text-sm text-muted-foreground">No fixtures added yet. Click matches above or add manually.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fixtures.map((fixture, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-white/5 bg-secondary/30 p-3">
                  <div className="flex-1 min-w-[90px]">
                    <Label className="text-xs text-muted-foreground">Team 1</Label>
                    <Select value={fixture.team1} onValueChange={v => updateFixture(index, "team1", v)}>
                      <SelectTrigger className="mt-1 bg-secondary/50 border-white/10 text-xs h-8">
                        <SelectValue placeholder="Team 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => t.team !== fixture.team2).map(t => (
                          <SelectItem key={t.team} value={t.team}>{t.team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[90px]">
                    <Label className="text-xs text-muted-foreground">Team 2</Label>
                    <Select value={fixture.team2} onValueChange={v => updateFixture(index, "team2", v)}>
                      <SelectTrigger className="mt-1 bg-secondary/50 border-white/10 text-xs h-8">
                        <SelectValue placeholder="Team 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.filter(t => t.team !== fixture.team1).map(t => (
                          <SelectItem key={t.team} value={t.team}>{t.team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[80px]">
                    <Label className="text-xs text-muted-foreground">Bats First</Label>
                    <Select
                      value={fixture.batting_first}
                      onValueChange={v => updateFixture(index, "batting_first", v as Fixture["batting_first"])}
                    >
                      <SelectTrigger className="mt-1 bg-secondary/50 border-white/10 text-xs h-8">
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
                    className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="w-full gap-2 glow-gold font-semibold"
          style={{ fontFamily: "Rajdhani,sans-serif", letterSpacing: "0.05em", fontSize: "0.95rem" }}
        >
          <Play className="h-4 w-4" />
          {loading ? "RUNNING SIMULATION..." : "RUN MONTE CARLO"}
        </Button>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground text-xl font-bold leading-none"
            >
              ✕
            </button>

            <h3 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "Rajdhani,sans-serif" }}>
              Monte Carlo Results
            </h3>

            {headline && (
              <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-foreground leading-relaxed">{headline}</p>
              </div>
            )}

            {chartData.length > 0 ? (
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                  Top-4 Qualification Probability
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                      <XAxis
                        dataKey="scenario"
                        tick={{ fill: "hsl(210 15% 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                        tick={{ fill: "hsl(210 15% 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 1]}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(222 30% 14% / 0.5)" }} />
                      <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry: any, i: number) => (
                          <Cell key={i} fill={getBarColor(entry.probability)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary inline-block" />≥70% Safe
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />40–70% Danger
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />&lt;40% Critical
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No chart data available.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
