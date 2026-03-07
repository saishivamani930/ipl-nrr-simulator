// API Types for WPL NRR Simulator

export interface Team {
  team: string;
  matches: number;
  points: number;
  nrr: number;
  position: number;
}

export interface StandingsResponse {
  standings: Team[];
  season: number;
}

export interface ThresholdResult {
  ok: boolean;
  value: number | null;
  reason: string | null;
  details?: {
    overs_str?: string;
    [key: string]: unknown;
  };
}

export interface ChaseMinScoreRequest {
  season: number;
  chasing_team: string;
  opponent_team: string;
  target_team: string;
  opponent_score: number;
  chase_balls: number;
}

export interface DefendMaxScoreRequest {
  season: number;
  defending_team: string;
  opponent_team: string;
  target_team: string;
  defending_score: number;
  opponent_balls: number;
}

export interface ChaseWinMaxBallsRequest {
  season: number;
  chasing_team: string;
  opponent_team: string;
  target_team: string;
  target_score: number;
}

export interface Fixture {
  team1: string;
  team2: string;
  batting_first: 'team1' | 'team2' | 'toss';
}

export interface MonteCarloRequest {
  focus_team: string;
  fixtures: Fixture[];
  iterations: number;
  confidence: number;
  seed?: number;
  use_nrr?: boolean;
}

export interface MonteCarloResult {
  qualification_probability: number;
  expected_points: number;
  expected_nrr: number;
  results: Array<{
    scenario: string;
    probability: number;
    [key: string]: unknown;
  }>;
}

export interface MatchSimulateRequest {
  team1: string;
  team2: string;
  team1_runs: number;
  team1_overs: string;
  team1_all_out: boolean;
  team2_runs: number;
  team2_overs: string;
  team2_all_out: boolean;
}

export interface MatchSimulateResult {
  result_description: string;
  updated_standings: Team[];
  team1: string;
  team2: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  message?: string;
}
