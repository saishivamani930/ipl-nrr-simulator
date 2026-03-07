import { Zap, Calculator, BarChart3, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';

interface HeroSectionProps {
  onNavigate: (section: string) => void;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <div className="flex min-h-screen flex-col pt-14">
      {/* Hero Area */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        {/* Season Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">WPL 2026 Season</span>
        </div>

        {/* Main Heading */}
        <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent">
            WPL Qualification
          </span>
          <br />
          <span className="text-foreground">& NRR Scenario Simulator</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          Calculate what your team needs to qualify. Simulate matches, run Monte
          Carlo projections, and discover the exact margins required.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => onNavigate('simulate')}
            className="gap-2"
          >
            <Calculator className="h-5 w-5" />
            Simulate Match
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate('planner')}
            className="gap-2 border-border bg-secondary/50 hover:bg-secondary"
          >
            <BarChart3 className="h-5 w-5" />
            Monte Carlo Planner
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-background px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Powerful Analysis Tools
            </h2>
            <p className="text-muted-foreground">
              Everything you need to understand your team's playoff chances
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Calculator className="h-6 w-6" />}
              title="NRR-Aware Simulation"
              description="Simulate match outcomes with precise runs, overs, and all-out scenarios factoring into Net Run Rate."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Monte Carlo Analysis"
              description="Run thousands of simulations to calculate Top-3 and Top-2 qualification probabilities."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Win Margin Calculator"
              description="Know exactly what margin your team needs to qualify—whether defending or chasing."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Batting Order Support"
              description="Account for toss outcomes and which team bats first in your scenarios."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card/50 px-4 py-16">
        <div className="container mx-auto text-center">
          <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
            Ready to Analyze Your Team's Chances?
          </h2>
          <p className="mb-6 text-muted-foreground">
            Start simulating matches and discover what it takes to qualify.
          </p>
          <Button onClick={() => onNavigate('simulate')} size="lg" className="gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
