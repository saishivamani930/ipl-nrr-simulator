import { useState, useEffect } from "react";
import { Calendar, RefreshCw, AlertCircle, MapPin } from "lucide-react";
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

// Generate TBD placeholders for matches 21–70
function generateTbdFixtures(startAfter: number): (EspnFixture & { _isTbd: boolean; _matchNum: number })[] {
  const count = 70 - startAfter;
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    match_id: `tbd-${startAfter + i + 1}`,
    date: "",
    team1: "TBD",
    team2: "TBD",
    team1_code: "",
    team2_code: "",
    status: "upcoming",
    venue: null,
    _isTbd: true,
    _matchNum: startAfter + i + 1,
  }));
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
      <span className="text-xs font-semibold text-center text-foreground leading-tight" style={{ fontFamily: "Rajdhani, sans-serif" }}>
        {name}
      </span>
    </div>
  );
}

export function ScheduleSection() {
  const [espnFixtures, setEspnFixtures] = useState<EspnFixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTbd, setShowTbd] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFixtures(2026);
      setEspnFixtures(data);
    } catch {
      setError("Could not load fixtures from ESPN.");
    } finally {
      setLoading(false);
    }
  }

  const realFixtures = [...espnFixtures].sort((a, b) => {
    const at = a.date ? new Date(a.date).getTime() : 0;
    const bt = b.date ? new Date(b.date).getTime() : 0;
    return at - bt;
  });

  const tbdFixtures = generateTbdFixtures(realFixtures.length);

  const allFixtures = [
    ...realFixtures,
    ...(showTbd ? tbdFixtures : []),
  ];

  const filtered = allFixtures.filter(f => {
    if (filter === "upcoming") return f.status !== "completed";
    if (filter === "completed") return f.status === "completed";
    return true;
  });

  // Group by date (TBD fixtures go under "Schedule TBD")
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, f) => {
    const key = (f as any)._isTbd ? "tbd" : (f.date ? toDateKey(f.date) : "tbd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

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
            <p className="text-sm text-muted-foreground">Full fixture list — league stage matches 1 to 70</p>
          </div>
        </div>

        {/* Toolbar */}
<div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
  {/* Row 1: Filter tabs */}
  <div className="flex flex-wrap items-center gap-2">
    {(["all", "upcoming", "completed"] as const).map(f => (
      <button
        key={f}
        onClick={() => setFilter(f)}
        className={`rounded-lg border px-3 py-1.5 text-xs font-mono capitalize transition-colors ${
          filter === f
            ? "border-[#173A8A] bg-[#173A8A]/10 text-[#173A8A] dark:border-primary/50 dark:bg-primary/10 dark:text-primary"
            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10"
        }`}
      >
        {f}
      </button>
    ))}
  </div>

  {/* Row 2 on mobile, same row on desktop */}
  <div className="flex items-center gap-2 sm:ml-auto">
    <button
      onClick={() => setShowTbd(v => !v)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
        showTbd
          ? "border-[#173A8A] bg-[#173A8A]/10 text-[#173A8A] dark:border-primary/50 dark:bg-primary/10 dark:text-primary"
          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10"
      }`}
    >
      {showTbd ? "Hide TBD (21–70)" : "Show TBD (21–70)"}
    </button>
    <button
      onClick={load}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      Refresh
    </button>
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
          <p className="text-center text-sm text-muted-foreground py-16">No fixtures found.</p>
        ) : (
          <div className="space-y-8">
            {sortedKeys.map(dateKey => {
              const dayFixtures = grouped[dateKey];
              const dateLabel = dateKey === "tbd" ? "Schedule TBD" : formatDate(dateKey + "T00:00:00");

              return (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#173A8A] dark:text-primary">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="space-y-3">
                    {dayFixtures.map((f, i) => {
                      const isTbd = !!(f as any)._isTbd;
                      const matchNum = isTbd ? (f as any)._matchNum : realFixtures.indexOf(f as EspnFixture) + 1;
                      const isCompleted = f.status === "completed";

                      return (
                        <div
                          key={f.match_id}
                          className={`rounded-xl border p-4 transition-colors ${
                            isCompleted
                                ? "border-gray-200 bg-white opacity-60 dark:border-white/5 dark:bg-white/5"
                                : isTbd
                                ? "border-gray-200 bg-white opacity-50 dark:border-white/5 dark:bg-secondary/10"
                                : "border-gray-300 bg-white dark:border-white/8 dark:bg-secondary/30"
                            }`}
                        >
                          {/* Match number + time */}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary dark:text-primary/70 tracking-wide">
                                Match {matchNum}
                                </span>
                            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                              {!isTbd && f.date && (
                                <span>{formatTime(f.date)}</span>
                              )}
                              {isCompleted && (
                                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-center gap-4">
                            {isTbd ? (
                              <>
                                <div className="flex flex-col items-center gap-1 w-28 sm:w-36">
                                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white/30 bg-white/5 border border-white/10">
                                    ?
                                  </div>
                                  <span className="text-xs font-semibold text-muted-foreground/50" style={{ fontFamily: "Rajdhani, sans-serif" }}>TBD</span>
                                </div>
                                <span className="text-lg font-bold text-white/20 font-mono">vs</span>
                                <div className="flex flex-col items-center gap-1 w-28 sm:w-36">
                                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white/30 bg-white/5 border border-white/10">
                                    ?
                                  </div>
                                  <span className="text-xs font-semibold text-muted-foreground/50" style={{ fontFamily: "Rajdhani, sans-serif" }}>TBD</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="relative">
                                    <TeamBadge code={(f as EspnFixture).team1_code} name={(f as EspnFixture).team1} />
                                    {isCompleted && (f as any).winner && (
                                    <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${(f as any).winner === (f as EspnFixture).team1_code ? "bg-green-500" : "bg-red-500"}`} />
                                    )}
                                </div>
                                <span className="text-lg font-bold text-gray-400 dark:text-white/40 font-mono">vs</span>
                                <div className="relative">
                                    <TeamBadge code={(f as EspnFixture).team2_code} name={(f as EspnFixture).team2} />
                                    {isCompleted && (f as any).winner && (
                                    <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${(f as any).winner === (f as EspnFixture).team2_code ? "bg-green-500" : "bg-red-500"}`} />
                                    )}
                                </div>
                                </>
                            )}
                          </div>

                          {/* Venue */}
                          {!isTbd && f.venue && (
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
