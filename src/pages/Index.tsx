import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import type { Team } from "@/types/api";

interface IndexProps {
  teams: Team[];
  loading?: boolean;
}

const Index = ({ teams, loading }: IndexProps) => {
  const navigate = useNavigate();

  return (
    <HeroSection
      teams={teams}
      loading={loading}
      onNavigate={(sectionOrPath: string) => {
        if (!sectionOrPath) return;
        if (sectionOrPath.startsWith("/")) { navigate(sectionOrPath); return; }
        if (sectionOrPath === "home") { navigate("/"); return; }
        navigate(`/${sectionOrPath}`);
      }}
    />
  );
};

export default Index;
