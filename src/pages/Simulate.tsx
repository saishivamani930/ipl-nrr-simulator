import { SimulateSection } from "@/components/SimulateSection";
import type { Team } from "@/types/api";

interface SimulateProps {
  teams: Team[];
  loading?: boolean;
  error?: string;
}

export default function Simulate({ teams, loading, error }: SimulateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading standings...
      </div>
    );
  }
  return <SimulateSection teams={teams} />;
}
