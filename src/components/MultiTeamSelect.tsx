import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, X, Check } from "lucide-react";
import type { Team } from "@/types/api";

export interface MultiTeamSelectProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  teams: Team[];
  excludeTeams?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function MultiTeamSelect({
  label,
  values,
  onChange,
  teams,
  excludeTeams = [],
  placeholder = "Select teams",
  disabled = false,
}: MultiTeamSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const exclude = new Set(excludeTeams.filter(Boolean));
  const filteredTeams = teams.filter(t => !exclude.has(t.team) && !exclude.has(t.code ?? ""));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(teamName: string) {
    if (values.includes(teamName)) {
      onChange(values.filter(v => v !== teamName));
    } else {
      onChange([...values, teamName]);
    }
  }

  function remove(teamName: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(values.filter(v => v !== teamName));
  }

  const displayText = values.length === 0
    ? placeholder
    : null;

  return (
    <div className="space-y-2" ref={ref}>
      <Label className="text-xs text-muted-foreground">{label}</Label>

      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className={`flex min-h-[2.25rem] w-full flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors
            ${open ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/10'}
            bg-secondary/50 hover:bg-secondary/70 disabled:opacity-50 disabled:cursor-not-allowed text-left`}
        >
          {displayText ? (
            <span className="text-muted-foreground">{displayText}</span>
          ) : (
            values.map(v => (
              <span key={v}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                {v}
                <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={e => remove(v, e)} />
              </span>
            ))
          )}
          <ChevronDown className={`ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-card shadow-xl">
            <div className="max-h-52 overflow-y-auto p-1">
              {filteredTeams.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">No teams available</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = filteredTeams.every(t => values.includes(t.team));
                      if (allSelected) {
                        onChange([]);
                      } else {
                        onChange(filteredTeams.map(t => t.team));
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-semibold transition-colors text-foreground hover:bg-secondary/50 border-b border-gray-200 dark:border-white/10 mb-1"
                  >
                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors
                      ${filteredTeams.every(t => values.includes(t.team)) ? 'border-primary bg-primary' : 'border-gray-400 dark:border-white/20 bg-transparent'}`}>
                      {filteredTeams.every(t => values.includes(t.team)) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </span>
                    Select All
                  </button>
                  {filteredTeams.map(t => {
                  const selected = values.includes(t.team);
                  return (
                    <button
                      key={t.team}
                      type="button"
                      onClick={() => toggle(t.team)}
                      className={`flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors
                        ${selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary/50'}`}
                    >
                      <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors
                        ${selected ? 'border-primary bg-primary' : 'border-gray-400 dark:border-white/20 bg-transparent'}`}>
                        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      {t.team}
                    </button>
                  );
                })}
              </>
                )}
            </div>
            {values.length > 0 && (
              <div className="border-t border-white/5 p-1">
                <button type="button" onClick={() => onChange([])}
                  className="w-full rounded-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-secondary/50 transition-colors text-left">
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}