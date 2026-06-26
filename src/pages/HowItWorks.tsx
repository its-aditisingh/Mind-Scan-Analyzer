import { Card } from "@/components/ui/card";
import { Database, Filter, Sliders, TreePine, Target } from "lucide-react";

const steps = [
  {
    icon: Database,
    title: "1. Load EEG features",
    desc: "Read the BRMH CSV (945 patients × 1,149 columns). Drop bookkeeping columns 'no.' and 'eeg.date'. Set 'main.disorder' as the target.",
  },
  {
    icon: Filter,
    title: "2. Impute missing values",
    desc: "Median imputation for numeric columns; most-frequent imputation for categorical columns (sex, specific.disorder, etc.).",
  },
  {
    icon: Sliders,
    title: "3. Encode & scale",
    desc: "Label-encode categorical columns. Standardize all features with StandardScaler so each has mean 0, variance 1.",
  },
  {
    icon: Target,
    title: "4. Select top features",
    desc: "SelectKBest with ANOVA F-test ranks features by class-discriminative power. Keep the 10 strongest signals.",
  },
  {
    icon: TreePine,
    title: "5. Random Forest (300 trees)",
    desc: "Class-balanced weights handle imbalance. Each tree votes; probabilities average across the forest. Final accuracy: 98.41%.",
  },
];

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">How the model works</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Five preprocessing and modelling steps, replicated faithfully from the source notebook and re-implemented in
          TypeScript so they run entirely in your browser.
        </p>
      </div>

      <div className="relative space-y-4">
        <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden sm:block" />
        {steps.map((s, i) => (
          <Card
            key={s.title}
            className="relative p-6 sm:p-8 gradient-card border-border shadow-soft hover:shadow-elevated transition-smooth sm:ml-16"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="absolute -left-16 top-8 hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
              <s.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex sm:hidden h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-12 p-8 gradient-card border-border">
        <h3 className="font-semibold text-lg mb-3">Why Random Forest for EEG?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          EEG feature spaces are wide (1,000+ correlated band-power and coherence measures) and noisy. Tree ensembles
          are robust to scale, handle non-linear interactions between channels, and produce feature-importance scores
          that make the decision interpretable to clinicians — unlike deep models that need orders of magnitude more
          data to outperform them on tabular EEG.
        </p>
      </Card>
    </div>
  );
}
