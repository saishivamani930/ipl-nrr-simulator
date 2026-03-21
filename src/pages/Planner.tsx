import { PlannerSection } from "@/components/PlannerSection";
import type { Team } from "@/types/api";

interface PlannerProps {
  teams: Team[];
  loading?: boolean;
  error?: string;
}

export default function Planner({ teams, loading }: PlannerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading standings...
      </div>
    );
  }
  return <PlannerSection teams={teams} />;
}
