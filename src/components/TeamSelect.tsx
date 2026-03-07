import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/types/api";

export interface TeamSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  teams: Team[];

  // ✅ optional new props (backward compatible)
  placeholder?: string;
  excludeTeams?: string[];
  disabled?: boolean;
}

export function TeamSelect({
  label,
  value,
  onChange,
  teams,
  placeholder = "Select team",
  excludeTeams = [],
  disabled = false,
}: TeamSelectProps) {
  const exclude = new Set(excludeTeams.filter(Boolean));

  const filteredTeams = teams.filter((t) => !exclude.has(t.team));

  return (
    <div className="space-y-2">
      <Label className="text-sm text-foreground">{label}</Label>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="bg-secondary/50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {filteredTeams.map((t) => (
            <SelectItem key={t.team} value={t.team}>
              {t.team}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
