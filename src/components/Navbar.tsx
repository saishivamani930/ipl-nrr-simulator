import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/simulate", label: "Simulator" },
  { to: "/planner", label: "Predictor" },
  { to: "/requirements", label: "Scenarios" },
  { to: "/schedule", label: "Schedule" },
  
];

export function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const { theme, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) => {
    if (to === "/") return path === "/";
    return path.startsWith(to);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#0f2a6d] bg-[#173A8A] shadow-sm dark:border-[#1c2c4f] dark:bg-[#08142c]">
      

      {/* Main navbar */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white/10">
            <img src="/ipl-logo.png" alt="IPL Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-none text-white" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.05em" }}>
              IPL NRR
            </span>
            <span className="text-[10px] leading-none font-mono tracking-widest uppercase text-[#f4b400]">
              Simulator
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative px-4 py-2 text-sm font-semibold transition-all duration-200 font-['Rajdhani'] tracking-wide",
                isActive(item.to) ? "text-white" : "text-white/80 hover:text-white"
              )}
            >
              <span className="relative z-10">{item.label}</span>
              {isActive(item.to) && (
                <span className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full bg-white" />
              )}
            </Link>
          ))}
          <button
          type="button"
          onClick={toggleTheme}
          className="ml-2 flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/90 transition hover:bg-white/20"
          aria-label="Toggle theme"
        >
          {mounted ? (theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />) : <Moon className="h-3.5 w-3.5" />}
        </button>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/90"
            aria-label="Toggle theme"
          >
            {mounted ? (theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />) : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(o => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white/90"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#173A8A] dark:bg-[#08142c]">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-6 py-3 text-sm font-semibold font-['Rajdhani'] tracking-wide border-b border-white/5",
                isActive(item.to) ? "text-[#f4b400] bg-white/5" : "text-white/80 hover:text-white hover:bg-white/5"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}