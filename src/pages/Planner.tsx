import { useEffect, useState } from "react";
import { PlannerSection } from "@/components/PlannerSection";
import { fetchStandings } from "@/lib/api";
import type { Team } from "@/types/api";

export default function Planner() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchStandings(2026);
        setTeams(data.standings ?? []);
      } catch (e) {
        console.error("Failed to load standings:", e);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="pt-20 px-4">Loading...</div>;

  return <PlannerSection teams={teams} />;
}