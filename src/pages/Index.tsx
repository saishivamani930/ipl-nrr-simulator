import { useNavigate } from "react-router-dom";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <HeroSection
        onNavigate={(sectionOrPath: string) => {
          if (!sectionOrPath) return;

          // If HeroSection already sends "/simulate" style
          if (sectionOrPath.startsWith("/")) {
            navigate(sectionOrPath);
            return;
          }

          // If HeroSection sends "home" / "simulate" / "planner" / "requirements"
          if (sectionOrPath === "home") {
            navigate("/");
            return;
          }

          navigate(`/${sectionOrPath}`);
        }}
      />
    </div>
  );
};

export default Index;
