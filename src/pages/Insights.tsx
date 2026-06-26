import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { MODEL } from "@/model/inference";
import { Brain, Waves } from "lucide-react";

const bands = [
  { name: "Delta", range: "0.5–4 Hz", color: "hsl(var(--chart-3))", desc: "Deep sleep, unconscious processing" },
  { name: "Theta", range: "4–8 Hz", color: "hsl(var(--chart-1))", desc: "Drowsiness, memory consolidation, creativity" },
  { name: "Alpha", range: "8–13 Hz", color: "hsl(var(--chart-2))", desc: "Relaxed wakefulness, eyes-closed rest" },
  { name: "Beta", range: "13–30 Hz", color: "hsl(var(--chart-4))", desc: "Active thinking, focus, anxiety markers" },
  { name: "High Beta", range: "20–30 Hz", color: "hsl(var(--chart-5))", desc: "Stress, hyperarousal" },
  { name: "Gamma", range: "30–80 Hz", color: "hsl(var(--chart-6))", desc: "Cognitive integration, perception binding" },
];

export default function Insights() {
  const top10 = MODEL.feature_importances.slice(0, 10).map((f) => ({
    name: f.name.length > 26 ? f.name.slice(0, 26) + "…" : f.name,
    fullName: f.name,
    importance: f.importance,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Model insights</h1>
        <p className="text-muted-foreground">
          What the Random Forest actually pays attention to, and the EEG bands behind those features.
        </p>
      </div>

      <Card className="p-6 gradient-card border-border shadow-elevated mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">Top 10 most important features</h3>
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Mean Gini decrease across all 300 trees. Higher = more discriminative for the disorder classification.
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 40 }}>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => v.toFixed(2)} />
            <YAxis dataKey="name" type="category" width={200} stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
              formatter={(v: number) => [v.toFixed(4), "importance"]}
            />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
              {top10.map((_, i) => (
                <Cell key={i} fill={`hsl(var(--chart-${(i % 7) + 1}))`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Waves className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">EEG frequency bands</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bands.map((b) => (
            <Card key={b.name} className="p-5 gradient-card border-border shadow-soft hover:shadow-elevated transition-smooth">
              <div className="flex items-end gap-1 h-12 mb-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm animate-wave"
                    style={{
                      background: b.color,
                      height: `${30 + Math.sin(i * 0.8 + Math.random()) * 35 + 35}%`,
                      animationDelay: `${i * 70}ms`,
                      animationDuration: `${1.2 + (i % 3) * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-semibold">{b.name}</h3>
                <span className="text-xs font-mono text-muted-foreground">{b.range}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
