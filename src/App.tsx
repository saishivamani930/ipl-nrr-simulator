// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Simulate from "./pages/Simulate";
import Planner from "./pages/Planner";
import Requirements from "./pages/Requirements";
import NotFound from "./pages/NotFound";

import { AppLayout } from "@/layouts/AppLayout";
import { getStandings } from "@/lib/api";
import type { Team, StandingsResponse } from "@/types/api";

import Schedule from "./pages/Schedule";

const queryClient = new QueryClient();

function toErrorMessage(err: unknown): string | undefined {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return undefined;
}

function AppRoutes() {
  const { data, isLoading, error } = useQuery<StandingsResponse, Error>({
    queryKey: ["standings", 2026, "live"],
    queryFn: () => getStandings({ season: 2026, source: "live" }),
    retry: 1,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const teams: Team[] = data?.standings ?? [];
  const errorMsg = toErrorMessage(error);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Index teams={teams} loading={isLoading} />} />
        <Route path="/simulate" element={<Simulate teams={teams} loading={isLoading} error={errorMsg} />} />
        <Route path="/planner" element={<Planner teams={teams} loading={isLoading} error={errorMsg} />} />
        <Route path="/requirements" element={<Requirements teams={teams} loading={isLoading} error={errorMsg} />} />
        <Route path="/schedule" element={<Schedule />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
