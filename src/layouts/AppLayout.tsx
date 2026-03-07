import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <Navbar />

      {/* Page content (push down because navbar is fixed/sticky) */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
