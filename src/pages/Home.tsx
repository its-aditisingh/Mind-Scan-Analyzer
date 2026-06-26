import { Link } from "react-router-dom";
import { Brain, Upload, BarChart3, Sparkles, ArrowRight, Activity, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MODEL } from "@/model/inference";

const features = [
  { icon: Activity, title: "1,149 EEG features", desc: "Power, coherence and connectivity across all canonical bands and channels." },
  { icon: Brain, title: "7 disorder classes", desc: "Mood, anxiety, addictive, schizophrenia, OCD, trauma, and healthy controls." },
  { icon: Zap, title: "Runs in your browser", desc: "300-tree Random Forest ported to TypeScript — no data ever leaves your device." },
  { icon: Shield, title: "98.4% accuracy", desc: "Trained on the BRMH dataset with stratified split and class-balanced weights." },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--chart-3)/0.15),transparent_50%)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6 animate-fade-in">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Powered by Random Forest · 300 trees · {MODEL.metrics.n_features_total} features</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 animate-fade-in">
            EEG signals,
            <br />
            <span className="text-gradient">decoded by AI.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-fade-in">
            Upload an EEG feature CSV and instantly classify it into one of seven mental disorder categories using a
            Random Forest model trained on the BRMH dataset of 945 patients.
          </p>

          <div className="flex flex-wrap gap-3 mb-16 animate-fade-in">
            <Button asChild size="lg" className="gradient-hero text-primary-foreground shadow-elevated hover:shadow-glow transition-smooth">
              <Link to="/predict">
                <Upload className="mr-2 h-4 w-4" /> Try the Classifier
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/performance">
                <BarChart3 className="mr-2 h-4 w-4" /> View Performance
              </Link>
            </Button>
          </div>

          {/* Animated EEG bars */}
          <div className="flex items-end gap-1.5 h-20 max-w-md opacity-70">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-primary to-primary-glow rounded-sm animate-wave"
                style={{
                  height: `${30 + Math.sin(i * 0.5) * 30 + 30}%`,
                  animationDelay: `${i * 60}ms`,
                  animationDuration: `${1.2 + (i % 4) * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="p-6 gradient-card border-border shadow-soft hover:shadow-elevated transition-smooth group">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-12 p-8 md:p-12 gradient-card border-border shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 gradient-glow pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to analyse a recording?</h2>
              <p className="text-muted-foreground">
                Drop a CSV with EEG features and get per-row predictions with confidence scores.
              </p>
            </div>
            <Button asChild size="lg" className="gradient-hero text-primary-foreground">
              <Link to="/predict">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
