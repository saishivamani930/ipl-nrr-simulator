import { useState, useEffect } from 'react';
import {
  Calculator,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  HelpCircle,
  X,
  Activity,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import type { Team } from '@/types/api';

interface HeroSectionProps {
  onNavigate: (section: string) => void;
}

// REPLACE the FeatureCard function with this:
function FeatureCard({
  icon,
  title,
  description,
  buttonLabel,
  targetSection,
  onNavigate,
  showHelp = false,
  onHelpClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  targetSection: string;
  onNavigate: (s: string) => void;
  showHelp?: boolean;
  onHelpClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHoverDevice = () => window.matchMedia('(hover: hover)').matches;

  return (
    <div
      className="rounded-xl border border-[#d8dce5] bg-white p-5 transition-all duration-300 hover:shadow-xl dark:border-white/10 dark:bg-[#111c2e] relative"
      onMouseEnter={() => { if (isHoverDevice()) setExpanded(true); }}
      onMouseLeave={() => { if (isHoverDevice()) setExpanded(false); }}
      onClick={() => { if (!isHoverDevice()) setExpanded(prev => !prev); }}
    >
      {showHelp && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onHelpClick?.(); }}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#d8dce5] bg-[#f8fafc] text-[#173A8A] hover:bg-[#eef4ff] dark:border-white/10 dark:bg-[#16243a] dark:text-white dark:hover:bg-[#1d2e49]"
          aria-label={`How ${title} works`}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-center gap-3 mb-3 pr-8">
        <div className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-xl bg-[#173A8A] text-white">
          {icon}
        </div>
        <h3
          className="text-lg font-bold text-[#081B4B] dark:text-white"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
        >
          {title}
        </h3>
      </div>

      {/* Expandable content — no height tricks, just show/hide with smooth transition */}
      <div
        style={{
          maxHeight: expanded ? '200px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <p className="text-sm text-[#6B7280] leading-relaxed mb-4 dark:text-[#94a3b8]">
          {description}
        </p>
        <Button
          onClick={e => {
            e.stopPropagation();
            if (targetSection === 'standings-section') {
              document.getElementById('standings-section')?.scrollIntoView({ behavior: 'smooth' });
            } else {
              onNavigate(targetSection);
            }
          }}
          className="w-full gap-2 border-0 bg-[#173A8A] font-semibold text-white hover:bg-[#102C74]"
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.05em',
            fontSize: '0.875rem',
          }}
        >
          {buttonLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[100px] flex-col items-center gap-1 rounded-xl border border-[#d8dce5] bg-white px-4 py-3 sm:min-w-[120px] sm:px-5 sm:py-4">
      <span className="font-mono text-xl sm:text-2xl font-bold text-[#173A8A]">{value}</span>
      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#6B7280]">{label}</span>
    </div>
  );
}

function FixturesPanel() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // Ping backend to wake it up from Render free tier sleep
  fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/health`)
    .catch(() => {});
}, []);

useEffect(() => {
  const loadFixtures = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/fixtures?season=2026`)
      .then(r => r.json())
      .then(data => {
        const list = data?.fixtures ?? data?.data?.fixtures ?? [];
        setFixtures(list);
      })
      .catch(() => setFixtures([]))
      .finally(() => setLoading(false));
  };

  loadFixtures();

  const interval = setInterval(() => {
    loadFixtures();
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const live = fixtures.filter(f => f.status === 'live');
  const upcoming = fixtures.filter(f => f.status === 'upcoming').slice(0, 5);

  if (!loading && fixtures.length === 0) return null;

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <section className="px-4 py-10 border-t border-[#d8dce5] dark:border-white/10">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <h2
            className="text-3xl font-bold text-[#081B4B] dark:text-white"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Upcoming Fixtures
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-[#6B7280]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#173A8A] border-t-transparent" />
            <span>Loading standings...</span>
            <span className="text-xs text-[#6B7280]/60 max-w-xs text-center">
              If this takes more than 10 seconds, the server may be waking up from sleep. Please wait a moment.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {live.map(f => (
              <div
                key={f.match_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-green-500/40 bg-green-500/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-bold text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                  </span>
                  <span
                    className="font-bold text-[#081B4B] dark:text-white text-sm"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {f.team1} <span className="text-[#6B7280] font-normal">vs</span> {f.team2}
                  </span>
                </div>
                {f.venue && (
                <span className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94a3b8]">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {f.venue}
                </span>
              )}
              </div>
            ))}

            {upcoming.map(f => (
              <div
                key={f.match_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#d8dce5] bg-white dark:border-white/10 dark:bg-[#111c2e] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d8dce5] dark:border-white/10 px-2.5 py-1 text-xs font-mono text-[#6B7280] dark:text-[#94a3b8]">
                    {formatDate(f.date)}
                  </span>
                  <span
                    className="font-bold text-[#081B4B] dark:text-white text-sm"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {f.team1} <span className="text-[#6B7280] font-normal">vs</span> {f.team2}
                  </span>
                </div>
                {f.venue && (
                  <span className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94a3b8]">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {f.venue}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Replace the LiveStandingsPanel function in your HeroSection.tsx with this one.
// Everything else in the file stays the same.

function LiveStandingsPanel({ teams, loading }: { teams: Team[]; loading?: boolean }) {
  const TEAM_LOGOS: Record<string, string> = {
    CSK: '/logos/CSK.png',
    MI: '/logos/MI.png',
    RCB: '/logos/RCB.png',
    KKR: '/logos/KKR.png',
    DC: '/logos/DC.png',
    PBKS: '/logos/PBKS.png',
    RR: '/logos/RR.png',
    SRH: '/logos/SRH.png',
    GT: '/logos/GT.png',
    LSG: '/logos/LSG.png',
  };

  // Map full team names → codes (for fixture lookup)
  const TEAM_NAME_TO_CODE: Record<string, string> = {
    'Royal Challengers Bengaluru': 'RCB',
    'Chennai Super Kings': 'CSK',
    'Mumbai Indians': 'MI',
    'Kolkata Knight Riders': 'KKR',
    'Delhi Capitals': 'DC',
    'Punjab Kings': 'PBKS',
    'Rajasthan Royals': 'RR',
    'Sunrisers Hyderabad': 'SRH',
    'Gujarat Titans': 'GT',
    'Lucknow Super Giants': 'LSG',
  };

  // Which team row is expanded (null = none)
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Cache: teamCode → fixture list
  const [fixtureCache, setFixtureCache] = useState<Record<string, any[]>>({});
  const [fixtureLoading, setFixtureLoading] = useState<string | null>(null);

  const toggleTeam = (teamCode: string) => {
  if (expandedTeam === teamCode) {
    setExpandedTeam(null);
    return;
  }
  setExpandedTeam(teamCode);

  // Already cached — no fetch needed
  if (fixtureCache[teamCode]) return;

  setFixtureLoading(teamCode);
  fetch(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/fixtures?season=2026`
  )
    .then(r => r.json())
    .then(data => {
      const allFixtures: any[] = data?.fixtures ?? data?.data?.fixtures ?? [];

      // Filter to this team using team1_code / team2_code (confirmed field names)
      const teamMatches = allFixtures.filter(
        f => f.team1_code === teamCode || f.team2_code === teamCode
      );

      // Cache ALL teams at once since we have the full list anyway
      const grouped: Record<string, any[]> = {};
      for (const f of allFixtures) {
        [f.team1_code, f.team2_code].forEach(code => {
          if (!code) return;
          if (!grouped[code]) grouped[code] = [];
          grouped[code].push(f);
        });
      }
      setFixtureCache(prev => ({ ...prev, ...grouped }));
    })
    .catch(() => {
      setFixtureCache(prev => ({ ...prev, [teamCode]: [] }));
    })
    .finally(() => setFixtureLoading(null));
};

  function formatShortDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  }

  // Opponent name: given a fixture and this team's code, return the other side
  function getOpponent(f: any, teamCode: string): string {
  return f.team1_code === teamCode
    ? (f.team2_code ?? f.team2)
    : (f.team1_code ?? f.team1);
}

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d8dce5] bg-white dark:border-white/10 dark:bg-[#111c2e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d8dce5] bg-[#173A8A] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span
            className="text-sm font-bold text-white"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            IPL 2026 Standings
          </span>
        </div>
        <span className="font-mono text-xs text-white/80">Top 4 qualify</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6B7280]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#173A8A] border-t-transparent" />
          Loading...
        </div>
      ) : teams.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#6B7280] dark:text-[#94a3b8]">
          Could not load standings. Is the backend running?
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#d8dce5] bg-[#f5f7fb] dark:border-white/5 dark:bg-[#0d1929]">
                <th className="w-6 px-2 py-2 text-left font-mono text-xs text-[#6B7280] dark:text-[#94a3b8]">#</th>
                <th className="px-2 py-2 text-left font-mono text-xs text-[#6B7280] dark:text-[#94a3b8]">Team</th>
                <th className="hidden px-2 py-2 text-center font-mono text-xs text-[#6B7280] dark:text-[#94a3b8] sm:table-cell">M</th>
                <th className="hidden px-2 py-2 text-center font-mono text-xs text-[#6B7280] dark:text-[#94a3b8] sm:table-cell">W</th>
                <th className="hidden px-2 py-2 text-center font-mono text-xs text-[#6B7280] dark:text-[#94a3b8] sm:table-cell">L</th>
                <th className="px-2 py-2 text-center font-mono text-xs text-[#6B7280] dark:text-[#94a3b8] sm:hidden">W-L</th>
                <th className="px-2 py-2 text-center font-mono text-xs text-[#6B7280] dark:text-[#94a3b8]">Pts</th>
                <th className="px-2 py-2 text-right font-mono text-xs text-[#6B7280] dark:text-[#94a3b8]">NRR</th>
                {/* Arrow column */}
                <th className="w-8 px-2 py-2" />
              </tr>
            </thead>

            <tbody>
              {teams.map((team, idx) => {
                const isTop4 = idx < 4;
                const isQualBoundary = idx === 3;
                const nrr = team.nrr ?? 0;
                const teamCode = team.code ?? TEAM_NAME_TO_CODE[team.team] ?? team.team;
                const isExpanded = expandedTeam === teamCode;
                const fixtures: any[] = fixtureCache[teamCode] ?? [];
                const isLoadingFixtures = fixtureLoading === teamCode;

                // Split into completed and upcoming
                const completed = fixtures.filter(f => f.status === 'completed' || f.result);
                const upcoming = fixtures.filter(f => f.status === 'upcoming' || (!f.result && !f.status));

                return (
                  <>
                    {/* Main team row */}
                    <tr
                      key={`row-${teamCode}`}
                      className={`border-b border-[#e7eaf1] transition-colors hover:bg-[#f8faff] dark:border-white/5 dark:hover:bg-[#1a2a42] ${
                        isQualBoundary ? 'border-b-2 border-b-[#173A8A]' : ''
                      }`}
                    >
                      <td className="px-2 py-2">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            isTop4
                              ? 'text-[#173A8A] dark:text-primary'
                              : 'text-[#6B7280] dark:text-[#94a3b8]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          {TEAM_LOGOS[teamCode] && (
                            <img
                              src={TEAM_LOGOS[teamCode]}
                              alt={team.team}
                              className="h-5 w-5 flex-shrink-0 object-contain"
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span
                            className={`hidden text-sm font-semibold sm:inline ${
                              isTop4
                                ? 'text-[#081B4B] dark:text-white'
                                : 'text-[#334155] dark:text-[#94a3b8]'
                            }`}
                            style={{ fontFamily: 'Rajdhani, sans-serif' }}
                          >
                            {team.team}
                          </span>
                          <span
                            className={`text-xs font-bold sm:hidden ${
                              isTop4
                                ? 'text-[#081B4B] dark:text-white'
                                : 'text-[#334155] dark:text-[#94a3b8]'
                            }`}
                            style={{ fontFamily: 'Rajdhani, sans-serif' }}
                          >
                            {teamCode}
                          </span>
                        </div>
                      </td>

                      <td className="hidden px-2 py-2 text-center font-mono text-xs text-[#6B7280] dark:text-[#94a3b8] sm:table-cell">
                        {team.matches}
                      </td>
                      <td className="hidden px-2 py-2 text-center font-mono text-xs text-green-600 dark:text-green-400 sm:table-cell">
                        {team.won ?? '—'}
                      </td>
                      <td className="hidden px-2 py-2 text-center font-mono text-xs text-red-500 dark:text-red-400 sm:table-cell">
                        {team.lost ?? '—'}
                      </td>

                      <td className="px-2 py-2 text-center font-mono text-xs sm:hidden">
                        <span className="text-green-600">{team.won ?? 0}</span>
                        <span className="text-[#6B7280]">-</span>
                        <span className="text-red-500">{team.lost ?? 0}</span>
                      </td>

                      <td className="px-2 py-2 text-center">
                        <span className="font-mono text-sm font-bold text-[#081B4B] dark:text-white">
                          {team.points}
                        </span>
                      </td>

                      <td className="px-2 py-2 text-right">
                        <span
                          className={`inline-flex items-center justify-end gap-1 font-mono text-xs ${
                            nrr > 0
                              ? 'text-green-600 dark:text-green-400'
                              : nrr < 0
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-[#6B7280] dark:text-[#94a3b8]'
                          }`}
                        >
                          {nrr > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : nrr < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {nrr > 0 ? '+' : ''}
                          {Math.abs(nrr) < 0.0005 ? '0.000' : nrr.toFixed(3)}
                        </span>
                      </td>

                      {/* Expand / collapse arrow */}
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggleTeam(teamCode)}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#eef4ff] hover:text-[#173A8A] dark:text-[#94a3b8] dark:hover:bg-[#1a2a42] dark:hover:text-white"
                          aria-label={isExpanded ? 'Collapse fixtures' : 'Expand fixtures'}
                        >
                          {/* Chevron rotates when expanded */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded fixtures row — spans full width */}
                    {isExpanded && (
                      <tr key={`expanded-${teamCode}`} className="bg-[#f5f7fb] dark:bg-[#0d1929]">
                        <td colSpan={9} className="px-4 py-3">
                          {isLoadingFixtures ? (
                            <div className="flex items-center gap-2 py-2 text-xs text-[#6B7280]">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#173A8A] border-t-transparent" />
                              Loading fixtures...
                            </div>
                          ) : fixtures.length === 0 ? (
                            <p className="py-2 text-xs text-[#6B7280] dark:text-[#94a3b8]">
                              No fixture data available.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {/* Completed matches */}
                              {completed.length > 0 && (
                                <div>
                                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#94a3b8]">
                                    Results
                                  </p>
                                  <div className="space-y-1.5">
                                    {completed.map((f, i) => {
                                      const opponent = getOpponent(f, teamCode);
                                      const won =
                                        f.winner_code === teamCode ||
                                        f.winner === teamCode ||
                                        (f.result && f.result.toLowerCase().includes('won') &&
                                          f.result.toLowerCase().includes(teamCode.toLowerCase()));
                                      return (
                                        <div
                                          key={i}
                                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-[#e7eaf1] bg-white px-3 py-2 dark:border-white/5 dark:bg-[#111c2e]"
                                        >
                                          <div className="flex items-center gap-2">
                                            {/* W / L badge */}
                                            <span
                                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                won
                                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                  : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                              }`}
                                            >
                                              {won ? 'W' : 'L'}
                                            </span>
                                            <span
                                              className="text-xs font-semibold text-[#081B4B] dark:text-white"
                                              style={{ fontFamily: 'Rajdhani, sans-serif' }}
                                            >
                                              vs {opponent}
                                            </span>
                                            {f.match_number && (
                                              <span className="text-[10px] text-[#6B7280]">
                                                Match {f.match_number}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            {f.date && (
                                              <span className="font-mono text-[10px] text-[#6B7280]">
                                                {formatShortDate(f.date)}
                                              </span>
                                            )}
                                            {f.result && (
                                              <span
                                                className={`text-[10px] font-medium ${
                                                  won
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-500 dark:text-red-400'
                                                }`}
                                              >
                                                {f.result}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Upcoming matches */}
                              {upcoming.length > 0 && (
                                <div>
                                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-[#6B7280] dark:text-[#94a3b8]">
                                    Upcoming
                                  </p>
                                  <div className="space-y-1.5">
                                    {upcoming.map((f, i) => {
                                      const opponent = getOpponent(f, teamCode);
                                      return (
                                        <div
                                          key={i}
                                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-[#e7eaf1] bg-white px-3 py-2 dark:border-white/5 dark:bg-[#111c2e]"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#173A8A] dark:bg-[#1a2a42] dark:text-[#93c5fd]">
                                              —
                                            </span>
                                            <span
                                              className="text-xs font-semibold text-[#081B4B] dark:text-white"
                                              style={{ fontFamily: 'Rajdhani, sans-serif' }}
                                            >
                                              vs {opponent}
                                            </span>
                                            {f.match_number && (
                                              <span className="text-[10px] text-[#6B7280]">
                                                Match {f.match_number}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            {f.date && (
                                              <span className="font-mono text-[10px] text-[#6B7280]">
                                                {formatShortDate(f.date)}
                                              </span>
                                            )}
                                            {f.venue && (
                                              <span className="hidden text-[10px] text-[#6B7280] sm:inline">
                                                {f.venue}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center gap-2 border-t border-[#d8dce5] bg-[#fafbfe] px-4 py-2 dark:border-white/5 dark:bg-[#0d1929]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f4b400]" />
            <span className="font-mono text-xs text-[#6B7280] dark:text-[#f4b400]">
              Top 4 qualify for playoffs
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


export function HeroSection({ onNavigate }: HeroSectionProps) {
  const [showMonteCarloHelp, setShowMonteCarloHelp] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
    useEffect(() => {
    const loadStandings = () => {
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/standings?season=2026`)
        .then(r => r.json())
        .then(data => {
          const list = data?.data?.teams ?? data?.teams ?? [];
          const sorted = [...list].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (b.nrr ?? 0) - (a.nrr ?? 0);
          });
          setTeams(sorted);
        })
        .catch(() => setTeams([]))
        .finally(() => setLoading(false));
    };

    loadStandings();

    const interval = setInterval(loadStandings, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f6] text-[#081B4B] dark:bg-[#0d1b2e] dark:text-white">
      <section className="relative overflow-hidden bg-[#173A8A] px-4 py-16 sm:py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#173A8A] to-[#102C74]" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-24 -top-32 opacity-65 hidden sm:block">
            <svg
              width="440"
              height="440"
              viewBox="0 0 440 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[440px] w-[440px]"
            >
              <defs>
                <linearGradient id="cornerSpringTL" x1="0%" y1="20%" x2="100%" y2="80%">
                  <stop offset="0%" stopColor="#D7D94C" />
                  <stop offset="45%" stopColor="#A08E56" />
                  <stop offset="100%" stopColor="#E96A8D" />
                </linearGradient>
              </defs>
              {Array.from({ length: 30 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="150"
                  cy="140"
                  rx="145"
                  ry="42"
                  transform={`rotate(${i * 10} 150 140)`}
                  stroke="url(#cornerSpringTL)"
                  strokeWidth="3.2"
                  opacity={0.9 - i * 0.02}
                />
              ))}
            </svg>
          </div>

          <div className="absolute -right-24 -top-32 opacity-65 hidden sm:block">
            <svg
              width="440"
              height="440"
              viewBox="0 0 440 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[440px] w-[440px] scale-x-[-1]"
            >
              <defs>
                <linearGradient id="cornerSpringTR" x1="0%" y1="20%" x2="100%" y2="80%">
                  <stop offset="0%" stopColor="#D7D94C" />
                  <stop offset="45%" stopColor="#A08E56" />
                  <stop offset="100%" stopColor="#E96A8D" />
                </linearGradient>
              </defs>
              {Array.from({ length: 30 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="150"
                  cy="140"
                  rx="145"
                  ry="42"
                  transform={`rotate(${i * 10} 150 140)`}
                  stroke="url(#cornerSpringTR)"
                  strokeWidth="3.2"
                  opacity={0.9 - i * 0.02}
                />
              ))}
            </svg>
          </div>

          <div className="absolute -left-24 -bottom-32 opacity-65 hidden sm:block">
            <svg
              width="440"
              height="440"
              viewBox="0 0 440 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[440px] w-[440px] scale-y-[-1]"
            >
              <defs>
                <linearGradient id="cornerSpringBL" x1="0%" y1="20%" x2="100%" y2="80%">
                  <stop offset="0%" stopColor="#D7D94C" />
                  <stop offset="45%" stopColor="#A08E56" />
                  <stop offset="100%" stopColor="#E96A8D" />
                </linearGradient>
              </defs>
              {Array.from({ length: 30 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="150"
                  cy="140"
                  rx="145"
                  ry="42"
                  transform={`rotate(${i * 10} 150 140)`}
                  stroke="url(#cornerSpringBL)"
                  strokeWidth="3.2"
                  opacity={0.9 - i * 0.02}
                />
              ))}
            </svg>
          </div>

          <div className="absolute -right-24 -bottom-32 opacity-65 hidden sm:block">
            <svg
              width="440"
              height="440"
              viewBox="0 0 440 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-[440px] w-[440px] scale-x-[-1] scale-y-[-1]"
            >
              <defs>
                <linearGradient id="cornerSpringBR" x1="0%" y1="20%" x2="100%" y2="80%">
                  <stop offset="0%" stopColor="#D7D94C" />
                  <stop offset="45%" stopColor="#A08E56" />
                  <stop offset="100%" stopColor="#E96A8D" />
                </linearGradient>
              </defs>
              {Array.from({ length: 30 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="150"
                  cy="140"
                  rx="145"
                  ry="42"
                  transform={`rotate(${i * 10} 150 140)`}
                  stroke="url(#cornerSpringBR)"
                  strokeWidth="3.2"
                  opacity={0.9 - i * 0.02}
                />
              ))}
            </svg>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-md bg-[#102C74] px-4 py-2 text-white shadow-sm">
            <span
              className="text-sm font-bold uppercase tracking-wider"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Indian Premier League
            </span>
          </div>
        </div>

        <div
          className="relative z-10 mx-auto max-w-5xl animate-fade-in"
          style={{ animationDelay: '0s', opacity: 0 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
            <Activity className="h-3.5 w-3.5 text-[#f4b400]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-white">
              IPL 2026 Season
            </span>
          </div>

          <h1
            className="mb-4 text-4xl font-bold sm:text-6xl lg:text-7xl"
            style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.02em' }}
          >
            <span className="block text-white">IPL QUALIFICATION</span>
            <span className="block text-[#f4b400]">& NRR SIMULATOR</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-sm sm:text-base leading-relaxed text-white/80">
            Real-time qualification analysis. Monte Carlo projections. Exact margins required. Built
            for IPL 2026.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => onNavigate('simulate')}
              className="gap-2 border-0 bg-[#f4b400] px-5 sm:px-6 font-semibold text-[#081B4B] hover:bg-[#e0a800]"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.05em',
                fontSize: '0.95rem',
              }}
            >
              <Calculator className="h-4 w-4" />
              SIMULATE MATCH
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('planner')}
              className="gap-2 border-white/25 bg-white/10 px-5 sm:px-6 font-semibold text-white hover:bg-white/15"
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '0.05em',
                fontSize: '0.95rem',
              }}
            >
              <BarChart3 className="h-4 w-4" />
              MONTE CARLO
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <StatBadge label="Teams" value="10" />
            <StatBadge label="League Matches" value="70" />
            <StatBadge label="Max Simulations" value="20K" />
            <StatBadge label="Playoff Spots" value="4" />
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6 text-center">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#f05a28]">Live Data</p>
            <h2
              className="text-3xl font-bold text-[#081B4B] dark:text-white"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Current Points Table
            </h2>
            <p className="mt-1 text-sm text-[#6B7280] dark:text-[#94a3b8]">
              Simulate any match to instantly see how standings change
            </p>
          </div>

          <div id="standings-section">
            <LiveStandingsPanel teams={teams} loading={loading} />
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => onNavigate('simulate')}
              className="gap-2 border-[#173A8A] bg-white text-[#173A8A] hover:bg-[#173A8A] hover:text-white"
              style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
            >
              <Calculator className="h-4 w-4" />
              SIMULATE A MATCH
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <FixturesPanel />

      <section className="border-t border-[#d8dce5] bg-white px-4 py-10 sm:py-14 dark:border-white/10 dark:bg-[#0d1b2e]">
        <div className="container mx-auto text-center">
          <h2
            className="mb-2 text-2xl font-bold text-[#081B4B] sm:text-3xl dark:text-white"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Ready to Crunch the Numbers?
          </h2>
          <p className="mb-6 text-sm text-[#6B7280] dark:text-[#94a3b8]">
            Start simulating and find out exactly what your team needs tonight.
          </p>
          <Button
            onClick={() => onNavigate('simulate')}
            size="lg"
            className="gap-2 border-0 bg-[#173A8A] font-semibold text-white hover:bg-[#102C74]"
            style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
          >
            GET STARTED
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="border-t border-[#d8dce5] bg-[#f7f8fb] px-4 py-12 sm:py-16 overflow-visible dark:border-white/10 dark:bg-[#0a1525]">
        <div className="container mx-auto max-w-5xl overflow-visible">
          <div className="mb-8 sm:mb-10 text-center">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#f05a28]">
              Arsenal
            </p>
            <h2
              className="text-3xl font-bold text-[#081B4B] dark:text-white"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Insight Engine
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">Tap or hover to expand</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <FeatureCard
              icon={<Calculator className="h-6 w-6" />}
              title="Simulator"
              description="Precise match simulation with runs, overs, and all-out scenarios updating Net Run Rate exactly."
              buttonLabel="OPEN SIMULATOR"
              targetSection="simulate"
              onNavigate={onNavigate}
            />

            <FeatureCard
  icon={<BarChart3 className="h-6 w-6" />}
  title="Predictor"
  description="Run thousands of simulations to calculate Top-4 qualification probabilities."
  buttonLabel="OPEN PREDICTOR"
  targetSection="planner"
  onNavigate={onNavigate}
  showHelp
  onHelpClick={() => setShowMonteCarloHelp(true)}
/>

            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="SCENARIOS"
              description="Know exactly what margin your team needs — whether batting first or second."
              buttonLabel="SCENARIOS"
              targetSection="requirements"
              onNavigate={onNavigate}
            />

            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Points Table"
              description="Reflects the current IPL 2026 points table.(Source: ESPNcricinfo"
              buttonLabel="VIEW STANDINGS"
              targetSection="standings-section"
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </section>
    {showMonteCarloHelp && (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
    onClick={() => setShowMonteCarloHelp(false)}
  >
    <div
      className="relative w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-[#d8dce5] bg-white shadow-2xl dark:border-white/10 dark:bg-[#111c2e] max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between border-b border-[#d8dce5] dark:border-white/10 pb-4">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#f05a28]">
              Monte Carlo Help
            </p>
            <h3
              className="text-2xl font-bold text-[#081B4B] dark:text-white"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              How this works
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowMonteCarloHelp(false)}
            className="ml-4 flex-shrink-0 text-[#6B7280] hover:text-[#081B4B] dark:text-[#94a3b8] dark:hover:text-white"
            aria-label="Close help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-[#475569] dark:text-[#cbd5e1]">
          <p>
            The Monte Carlo simulator does not predict one exact future. Instead, it simulates
            the remaining season many times and checks how often each team finishes in the top 4.
          </p>

          <div className="rounded-xl border border-[#d8dce5] bg-[#f8fafc] p-4 dark:border-white/10 dark:bg-[#16243a]">
            <p className="font-semibold text-[#081B4B] dark:text-white mb-2">Simple flow</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Take the current points table.</li>
              <li>Take the remaining fixtures.</li>
              <li>Simulate each remaining match many times.</li>
              <li>Recalculate points and NRR after every simulated season.</li>
              <li>Check which teams end in the top 4.</li>
              <li>Convert that count into probability.</li>
            </ol>
          </div>

          <p>
            Example: if Chennai qualifies in <strong>7,200</strong> out of <strong>10,000</strong>{' '}
            simulated seasons, its top-4 qualification probability becomes <strong>72%</strong>.
          </p>

          <p>
            So when you see a value like <strong>72%</strong>, it means:
            <br />
            <span className="text-[#173A8A] dark:text-[#93c5fd] font-medium">
              "In the simulated possible futures, this team reached the top 4 in 72% of them."
            </span>
          </p>

          <div className="rounded-xl border border-[#d8dce5] bg-[#fdfcf7] p-4 dark:border-white/10 dark:bg-[#1d2432]">
            <p className="font-semibold text-[#081B4B] dark:text-white mb-2">What is  Seed?</p>
            <p>
              The <strong>Seed</strong> is an optional number that makes the simulation reproducible.
              By default, each run uses different randomness and gives slightly different results.
              Setting a seed — e.g. <strong>42</strong> — locks the randomness so you get the exact
              same result every time. Useful for comparing scenarios fairly or debugging.
            </p>
          </div>

          <div className="rounded-xl border border-[#d8dce5] bg-[#fdfcf7] p-4 dark:border-white/10 dark:bg-[#1d2432]">
            <p className="font-semibold text-[#081B4B] dark:text-white mb-2">Important note</p>
            <p>
              This is a probability model, not a guarantee. It depends on the current standings,
              remaining fixtures, and the simulator assumptions. It helps estimate chances, not
              announce final results.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => setShowMonteCarloHelp(false)}
            className="border-0 bg-[#173A8A] text-white hover:bg-[#102C74]"
            style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em' }}
          >
            GOT IT
          </Button>
        </div>
      </div>
    </div>
  </div>
)}

      <Footer />
    </div>
  );
}