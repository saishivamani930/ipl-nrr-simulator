import { useEffect, useState } from "react";
import { SimulateSection } from "@/components/SimulateSection";
import { fetchStandings } from "@/lib/api";
import type { Team } from "@/types/api";

export default function Simulate() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const data = await fetchStandings(2026);
        if (mounted) {
          setTeams(data.standings ?? []);
        }
      } catch (e) {
        console.error("Failed to load standings:", e);
        if (mounted) {
          setTeams([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="pt-20 px-4">Loading...</div>;
  }

  return <SimulateSection teams={teams} />;
}