import { useState, useEffect, useMemo } from "react";
import { Calendar, RefreshCw, AlertCircle, MapPin, ChevronDown, X } from "lucide-react";
import { fetchFixtures } from "@/lib/api";
import type { EspnFixture } from "@/lib/api";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

function toDateKey(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

const TEAM_COLORS: Record<string, string> = {
  MI:   "#004BA0",
  CSK:  "#F4B400",
  RCB:  "#CC0000",
  KKR:  "#2E0854",
  DC:   "#0078BC",
  SRH:  "#F26522",
  PBKS: "#ED1B24",
  RR:   "#254AA5",
  GT:   "#1C1C1C",
  LSG:  "#A0C2F9",
};

function TeamBadge({ code, name }: { code: string; name: string }) {
  const color = TEAM_COLORS[code] || "#334155";
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex flex-col items-center gap-1 w-28 sm:w-36">
      {!imgError && code ? (
        <img
          src={`/logos/${code}.png`}
          alt={code}
          className="h-16 w-16 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
          style={{ backgroundColor: color }}
        >
          {code || name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span
        className="text-xs font-semibold text-center text-foreground leading-tight"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        {name}
      </span>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = !!value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
          isActive
            ? "border-[#173A8A] bg-[#173A8A]/10 text-[#173A8A] dark:border-primary/50 dark:bg-primary/10 dark:text-primary"
            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10"
        }`}
      >
        {isActive ? value : label}
        {isActive ? (
          <X
            className="h-3 w-3 ml-0.5 opacity-60 hover:opacity-100"
            onClick={e => { e.stopPropagation(); onClear(); setOpen(false); }}
          />
        ) : (
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 min-w-[200px] max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[hsl(222,47%,12%)]">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                  value === opt
                    ? "text-[#173A8A] font-bold dark:text-primary bg-[#173A8A]/5 dark:bg-primary/10"
                    : "text-gray-700 dark:text-muted-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ScheduleSection() {
  const [fixtures, setFixtures] = useState<EspnFixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [venueFilter, setVenueFilter] = useState<string>("");

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (fixtures.length > 0) {
      console.log("Match 1:", fixtures[0]);
    }
  }, [fixtures]);
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFixtures(2026);
      const sorted = [...data].sort((a, b) => {
        const at = a.date ? new Date(a.date).getTime() : 0;
        const bt = b.date ? new Date(b.date).getTime() : 0;
        return at - bt;
      });
      setFixtures(sorted);
    } catch {
      setError("Could not load fixtures.");
    } finally {
      setLoading(false);
    }
  }

  const teamOptions = useMemo(() => {
    const teams = new Set<string>();
    fixtures.forEach(f => {
      if (f.team1) teams.add(f.team1);
      if (f.team2) teams.add(f.team2);
    });
    return Array.from(teams).sort();
  }, [fixtures]);

  const venueOptions = useMemo(() => {
    const venues = new Set<string>();
    fixtures.forEach(f => { if (f.venue) venues.add(f.venue); });
    return Array.from(venues).sort();
  }, [fixtures]);

  const filtered = useMemo(() => fixtures.filter(f => {
    if (statusFilter === "upcoming" && f.status === "completed") return false;
    if (statusFilter === "completed" && f.status !== "completed") return false;
    if (teamFilter && f.team1 !== teamFilter && f.team2 !== teamFilter) return false;
    if (venueFilter && f.venue !== venueFilter) return false;
    return true;
  }), [fixtures, statusFilter, teamFilter, venueFilter]);

  const activeFilterCount = [teamFilter, venueFilter].filter(Boolean).length;

  function clearAllFilters() {
    setStatusFilter("all");
    setTeamFilter("");
    setVenueFilter("");
  }

  const grouped = useMemo(() => filtered.reduce<Record<string, EspnFixture[]>>((acc, f) => {
    const key = f.date ? toDateKey(f.date) : "tbd";
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {}), [filtered]);

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "tbd") return 1;
    if (b === "tbd") return -1;
    return a.localeCompare(b);
  });

  return (
    <section className="min-h-screen pt-14 bg-white dark:bg-[hsl(222,47%,8%)]">
      <div className="container mx-auto px-4 py-4 max-w-3xl">

        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              IPL 2026 Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              70 T20S . March 28 - May 31
              {fixtures.length > 0 && (
                <span className="ml-2 text-primary font-mono">
                  ({filtered.length}{filtered.length !== fixtures.length ? ` of ${fixtures.length}` : ""} league stage matches)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 space-y-2">
          {/* Row 1: Status + Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "upcoming", "completed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono capitalize transition-colors ${
                  statusFilter === f
                    ? "border-[#173A8A] bg-[#173A8A]/10 text-[#173A8A] dark:border-primary/50 dark:bg-primary/10 dark:text-primary"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={load}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Row 2: Team + Venue dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Filter by Team"
              value={teamFilter}
              options={teamOptions}
              onChange={setTeamFilter}
              onClear={() => setTeamFilter("")}
            />
            <FilterDropdown
              label="Filter by Venue"
              value={venueFilter}
              options={venueOptions}
              onChange={setVenueFilter}
              onClear={() => setVenueFilter("")}
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-mono text-red-500 hover:bg-red-100 transition-colors dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading schedule...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-muted-foreground">No matches found for the selected filters.</p>
            <button
              onClick={clearAllFilters}
              className="text-xs font-mono text-primary underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedKeys.map(dateKey => {
              const dayFixtures = grouped[dateKey];
              const dateLabel = dateKey === "tbd"
                ? "Schedule TBD"
                : formatDate(dateKey + "T00:00:00");

              return (
                <div key={dateKey}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#173A8A] dark:text-primary">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                  </div>

                  <div className="space-y-3">
                    {dayFixtures.map(f => {
                      const matchNum = fixtures.indexOf(f) + 1;
                      const isCompleted = f.status === "completed";

                      return (
                        <div
                          key={f.match_id}
                          className={`rounded-xl border p-4 transition-colors ${
                            isCompleted
                              ? "border-gray-200 bg-white opacity-60 dark:border-white/5 dark:bg-white/5"
                              : "border-gray-300 bg-white dark:border-white/8 dark:bg-secondary/30"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary dark:text-primary/70 tracking-wide">
                              Match {matchNum}
                            </span>
                            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                              {f.date && <span>{formatTime(f.date)}</span>}
                              {isCompleted && (
                                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-4">
                            <div className="relative">
                              <TeamBadge code={f.team1_code} name={f.team1} />
                              {isCompleted && (f as any).winner && (
                                <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${(f as any).winner === f.team1_code ? "bg-green-500" : "bg-red-500"}`} />
                              )}
                            </div>
                            <span className="text-lg font-bold text-gray-400 dark:text-white/40 font-mono">vs</span>
                            <div className="relative">
                              <TeamBadge code={f.team2_code} name={f.team2} />
                              {isCompleted && (f as any).winner && (
                                <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${(f as any).winner === f.team2_code ? "bg-green-500" : "bg-red-500"}`} />
                              )}
                            </div>
                          </div>

                          {f.venue && (
                            <div className="mt-3 flex items-center justify-center gap-1 text-xs font-mono font-semibold text-gray-600 dark:text-white/70">
                              <MapPin className="h-3 w-3" />
                              {f.venue}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
