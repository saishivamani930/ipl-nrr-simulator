import { RequirementsSection } from "@/components/RequirementsSection";
import type { Team } from "@/types/api";

interface RequirementsProps {
  teams: Team[];
  loading?: boolean;
  error?: string;
}

export default function Requirements({ teams, loading }: RequirementsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading standings...
      </div>
    );
  }
  return <RequirementsSection teams={teams} />;
}
