// src/lib/api.ts
import type {
  Team,
  StandingsResponse,
  MatchSimulateRequest,
  MatchSimulateResult,
  MonteCarloRequest,
  MonteCarloResult,
} from "@/types/api";

/**
 * IMPORTANT (Vite):
 * Put this in your project root .env (and RESTART dev server):
 * VITE_API_BASE_URL=http://localhost:8000
 */
const ENV = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const API_BASE = ENV.VITE_API_BASE_URL || "http://localhost:8000";
const API_PREFIX = "/api";
const DEFAULT_SOURCE = "live";
const DEFAULT_SEASON = 2026;

// -----------------------------
// Small safe parsing helpers
// -----------------------------
type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getRecord(obj: unknown, key: string): UnknownRecord | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return isRecord(v) ? v : null;
}

function getArray(obj: unknown, key: string): unknown[] | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return Array.isArray(v) ? v : null;
}

function getString(obj: unknown, key: string): string | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function getNumber(obj: unknown, key: string): number | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getBoolean(obj: unknown, key: string): boolean | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return typeof v === "boolean" ? v : null;
}

async function readJsonSafe(res: Response): Promise<unknown | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Safe JSON parsing + better error messages.
 */
async function handleResponse<T>(
  response: Response,
  normalize: (payload: unknown) => T
): Promise<T> {
  if (!response.ok) {
    let detail = `API error: ${response.status}`;

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    try {
      if (isJson) {
        const errorData = await readJsonSafe(response);
        if (isRecord(errorData)) {
          const d = getString(errorData, "detail") ?? getString(errorData, "message");
          if (d) detail = d;
        }
      } else {
        const text = await response.text();
        if (text) detail = `${detail} - ${text}`;
      }
    } catch {
      // ignore
    }

    throw new Error(detail);
  }

  const payload = await readJsonSafe(response);
  return normalize(payload);
}

// -----------------------------
// URL builder
// -----------------------------
function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(path, API_BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

// -----------------------------
// Team code mapping (name <-> code)
// -----------------------------
const teamCodeByName = new Map<string, string>();
const teamNameByCode = new Map<string, string>();

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function cacheTeams(teams: Team[]) {
  teamCodeByName.clear();
  teamNameByCode.clear();

  for (const t of teams) {
    const name = (t.team ?? "").trim();
    const code = (t.code ?? "").trim();

    if (name && code) {
      teamCodeByName.set(normalizeKey(name), code);
      teamNameByCode.set(code, name);
    }
  }
}

/**
 * Accepts either:
 * - code like "RCB-W"
 * - name like "Royal Challengers Bengaluru Women"
 * Returns a code.
 */
function toTeamCode(input: string): string {
  const s = (input ?? "").trim();
  if (!s) return s;

  // if it already looks like a code and exists in cache
  if (teamNameByCode.has(s)) return s;

  const byName = teamCodeByName.get(normalizeKey(s));
  if (byName) return byName;

  // last resort: return as-is (backend may still accept it)
  return s;
}

// -----------------------------
// Normalizers (backend -> frontend types)
// -----------------------------
function normalizeTeamRow(row: unknown, fallbackPos: number): Team {
  const teamName = getString(row, "team") ?? "Unknown";
  const code = getString(row, "code") ?? undefined;

  const matches = getNumber(row, "matches") ?? getNumber(row, "played") ?? 0;
  const won = getNumber(row, "won") ?? 0;
  const lost = getNumber(row, "lost") ?? 0;
  const nr = getNumber(row, "nr") ?? 0;
  const tied = getNumber(row, "tied") ?? 0;
  const points = getNumber(row, "points") ?? 0;
  const nrr = getNumber(row, "nrr") ?? 0;

  const position = getNumber(row, "position") ?? getNumber(row, "pos") ?? fallbackPos;

  const runs_for = getNumber(row, "runs_for") ?? undefined;
  const balls_for = getNumber(row, "balls_for") ?? undefined;
  const runs_against = getNumber(row, "runs_against") ?? undefined;
  const balls_against = getNumber(row, "balls_against") ?? undefined;

  const t: Team = {
    team: teamName,
    ...(code ? { code } : {}),
    matches,
    won,
    lost,
    nr,
    tied,
    points,
    nrr,
    position,
    ...(typeof runs_for === "number" ? { runs_for } : {}),
    ...(typeof balls_for === "number" ? { balls_for } : {}),
    ...(typeof runs_against === "number" ? { runs_against } : {}),
    ...(typeof balls_against === "number" ? { balls_against } : {}),
  };

  return t;
}

/**
 * Backend standings shape you shared:
 * {
 *  source, season, stale,
 *  data: { last_updated_utc, teams: [...] }
 * }
 */
function normalizeStandings(payload: unknown): StandingsResponse {
  const root = isRecord(payload) ? payload : {};
  const data = getRecord(root, "data");

  const season = getNumber(root, "season") ?? (data ? getNumber(data, "season") : null) ?? 0;

  const teamsArr = data ? getArray(data, "teams") : null;
  const standings = (teamsArr ?? []).map((r, i) => normalizeTeamRow(r, i + 1));

  const out: StandingsResponse = {
    season,
    standings,
    ...(getString(root, "source") ? { source: getString(root, "source") as string } : {}),
    ...(getBoolean(root, "stale") !== null ? { stale: getBoolean(root, "stale") as boolean } : {}),
    ...(data && getString(data, "last_updated_utc")
      ? { last_updated_utc: getString(data, "last_updated_utc") as string }
      : {}),
  };

  // build name->code map for later simulate/montecarlo calls
  cacheTeams(standings);

  return out;
}

/**
 * Simulate backend shape:
 * { input: {...}, updated_table: [...] }
 * We return: { result_description, updated_standings, team1, team2 }
 */
function normalizeSimulate(payload: unknown): MatchSimulateResult {
  const root = isRecord(payload) ? payload : {};
  const input = getRecord(root, "input") ?? root;

  const team1 = getString(input, "team1") ?? "";
  const team2 = getString(input, "team2") ?? "";

  const updatedTable = getArray(root, "updated_table") ?? getArray(root, "updated_standings") ?? [];
  const updated_standings = updatedTable.map((r, i) => normalizeTeamRow(r, i + 1));

  const result_description =
    getString(root, "result_description") ?? getString(root, "result") ?? "Simulation complete";

  return { result_description, updated_standings, team1, team2 };
}

function getNumberAny(objs: unknown[], key: string): number | undefined {
  for (const o of objs) {
    const n = getNumber(o, key);
    if (typeof n === "number") return n;
  }
  return undefined;
}

/**
 * Converts backend top3_probability/top4_probability/top2_probability maps into results[] rows
 * Also makes sure expected_* fields are numbers (avoids .toFixed crashes).
 */
function normalizeMonteCarlo(payload: unknown): MonteCarloResult {
  const root = isRecord(payload) ? payload : {};
  const resultObj = getRecord(root, "result") ?? root;

  type ScenarioProb = { scenario: string; probability: number };

  const top3 = getRecord(resultObj, "top3_probability");
  const top4 = getRecord(resultObj, "top4_probability");
  const top2 = getRecord(resultObj, "top2_probability");

  const mapToScenarioProb = (obj: UnknownRecord, labelPrefix: string): ScenarioProb[] => {
    return Object.entries(obj)
      .map(([k, v]) => {
        if (typeof v !== "number" || !Number.isFinite(v)) return null;
        return { scenario: `${labelPrefix}${k}`, probability: v };
      })
      .filter((x): x is ScenarioProb => x !== null);
  };

  let results: ScenarioProb[] = [];
  // ✅ Prefer Top-3
  if (top3) results = mapToScenarioProb(top3, "Top-3: ");
  else if (top4) results = mapToScenarioProb(top4, "Top-4: ");
  else if (top2) results = mapToScenarioProb(top2, "Top-2: ");
  else {
    const raw = getArray(resultObj, "results") ?? [];
    results = raw
      .map((r) => {
        const scenario = getString(r, "scenario");
        const probability = getNumber(r, "probability");
        if (!scenario || probability === null) return null;
        return { scenario, probability };
      })
      .filter((x): x is ScenarioProb => x !== null);
  }

  // These must be numbers for your current UI (it calls .toFixed on them)
  const qualification_probability =
    getNumberAny([resultObj, root], "qualification_probability") ?? 0;

  const expected_points = getNumberAny([resultObj, root], "expected_points") ?? 0;

  const expected_nrr = getNumberAny([resultObj, root], "expected_nrr") ?? 0;

  return {
    qualification_probability,
    expected_points,
    expected_nrr,
    results,
  } as MonteCarloResult;
}

// -----------------------------
// API: exported functions (names MUST match UI imports)
// -----------------------------

// Keep compatibility with older UI calls: getStandings({ season, source })
export async function getStandings(
  opts?: { season?: number; source?: string }
): Promise<StandingsResponse> {
  // source is ignored here because your GET /api/standings usually doesn't need it
  return fetchStandings(opts?.season ?? 2026);
}

/** UI may import checkHealth */
export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(buildUrl("/health"), { method: "GET" });
  return handleResponse(res, (p) => {
    if (isRecord(p) && typeof p.status === "string") return { status: p.status };
    return { status: "ok" };
  });
}

/**
 * UI may import fetchStandings
 * Backend: GET /api/standings?season=2026
 */
export async function fetchStandings(season = 2026): Promise<StandingsResponse> {
  const res = await fetch(buildUrl("/api/standings", { season }), { method: "GET" });
  return handleResponse(res, normalizeStandings);
}

/**
 * Simulate Match
 * Backend: POST /api/simulate?source=live&season=2026
 * Backend expects team codes like "GG-W", not full names.
 */
export async function simulateMatch(
  body: MatchSimulateRequest,
  opts?: { season?: number; source?: "live" | "mock" }
): Promise<MatchSimulateResult> {
  const season = opts?.season ?? 2026;
  const source = opts?.source ?? "live";

  // convert names -> codes
  const fixedBody: UnknownRecord = isRecord(body) ? { ...body } : {};
  if (typeof fixedBody.team1 === "string") fixedBody.team1 = toTeamCode(fixedBody.team1);
  if (typeof fixedBody.team2 === "string") fixedBody.team2 = toTeamCode(fixedBody.team2);

  const res = await fetch(buildUrl("/api/simulate", { source, season }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fixedBody),
  });

  return handleResponse(res, normalizeSimulate);
}

/**
 * Monte Carlo Planner
 * Backend: POST /api/plan/montecarlo?source=live&season=2026
 * Also convert fixture team names -> codes
 */
export async function runMonteCarloSimulation(
  body: MonteCarloRequest,
  opts?: { season?: number; source?: "live" | "mock" }
): Promise<MonteCarloResult> {
  const season = opts?.season ?? 2026;
  const source = opts?.source ?? "live";

  const fixedBody: UnknownRecord = isRecord(body) ? { ...body } : {};

  // If fixtures exist, map team1/team2 inside each fixture
  if (Array.isArray((fixedBody as UnknownRecord).fixtures)) {
    (fixedBody as UnknownRecord).fixtures = ((fixedBody as UnknownRecord).fixtures as unknown[]).map(
      (fx) => {
        if (!isRecord(fx)) return fx;
        const out: UnknownRecord = { ...fx };
        if (typeof out.team1 === "string") out.team1 = toTeamCode(out.team1);
        if (typeof out.team2 === "string") out.team2 = toTeamCode(out.team2);
        return out;
      }
    );
  }

  // optional focus_team mapping (helps if backend supports it)
  if (typeof (fixedBody as UnknownRecord).focus_team === "string") {
    (fixedBody as UnknownRecord).focus_team = toTeamCode(
      (fixedBody as UnknownRecord).focus_team as string
    );
  }

  const res = await fetch(buildUrl("/api/plan/montecarlo", { source, season }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fixedBody),
  });

  return handleResponse(res, normalizeMonteCarlo);
}

// -----------------------------
// Threshold calculators (EXPORTED because UI imports them)
// Backend endpoints from your swagger:
// POST /api/thresholds/chase-loss/min-score
// POST /api/thresholds/defend/max-opp-score
// POST /api/thresholds/chase-win/max-balls
// -----------------------------
const TEAM_KEYS = new Set([
  "team",
  "team1",
  "team2",
  "chasing_team",
  "opponent_team",
  "target_team",
  "defending_team",
  "focus_team",
  "teamCode",
  "team_code",
]);

function toSnakeCaseKey(k: string): string {
  // opponentScore -> opponent_score, chaseBalls -> chase_balls, etc.
  return k.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function prepareThresholdBody(input: unknown): UnknownRecord {
  const src: UnknownRecord = isRecord(input) ? input : {};

  // Build a NEW object with ONLY snake_case keys
  const out: UnknownRecord = {};
  for (const [k, v] of Object.entries(src)) {
    const sk = toSnakeCaseKey(k);
    out[sk] = v;
  }

  // Team fields -> always send CODE (RCB-W, GG-W, etc.)
  // (these keys are what backend likely expects)
  const teamFields = [
    "team",
    "team1",
    "team2",
    "chasing_team",
    "opponent_team",
    "target_team",
    "defending_team",
    "focus_team",
  ];

  for (const key of teamFields) {
    const v = out[key];
    if (typeof v === "string") out[key] = toTeamCode(v);
  }

  // Numeric coercion (sometimes UI sends strings)
  const numFields = ["opponent_score", "chase_balls", "target_points", "max_opp_score", "min_score", "balls"];
  for (const key of numFields) {
    const v = out[key];
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      out[key] = Number(v);
    }
  }

  return out;
}

// Threshold calculator endpoints (exported because UI imports them)
export async function calculateChaseMinScore(body: unknown): Promise<unknown> {
  const url =
    `${API_BASE}${API_PREFIX}/thresholds/chase-loss/min-score` +
    `?source=${encodeURIComponent(DEFAULT_SOURCE)}` +
    `&season=${encodeURIComponent(DEFAULT_SEASON)}`;

  const payload = prepareThresholdBody(body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, (p) => p);
}

export async function calculateDefendMaxScore(body: unknown): Promise<unknown> {
  const url =
    `${API_BASE}${API_PREFIX}/thresholds/defend/max-opp-score` +
    `?source=${encodeURIComponent(DEFAULT_SOURCE)}` +
    `&season=${encodeURIComponent(DEFAULT_SEASON)}`;

  const payload = prepareThresholdBody(body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, (p) => p);
}

export async function calculateChaseWinMaxBalls(body: unknown): Promise<unknown> {
  const url =
    `${API_BASE}${API_PREFIX}/thresholds/chase-win/max-balls` +
    `?source=${encodeURIComponent(DEFAULT_SOURCE)}` +
    `&season=${encodeURIComponent(DEFAULT_SEASON)}`;

  const payload = prepareThresholdBody(body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, (p) => p);
}
