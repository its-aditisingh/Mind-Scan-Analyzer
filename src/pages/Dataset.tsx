import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODEL } from "@/model/inference";
import { Database, Users, Activity, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function Dataset() {
  const dist = MODEL.metrics.classification_report.map((c) => ({
    name: c.class,
    // approximate full counts: support is the 20% test split
    value: Math.round(c.support / 0.2),
  }));

  const facts = [
    { icon: Users, label: "Patients", value: MODEL.metrics.n_samples.toLocaleString() },
    { icon: Activity, label: "EEG features", value: MODEL.metrics.n_features_total.toLocaleString() },
    { icon: Database, label: "Disorder classes", value: MODEL.classes.length },
    { icon: FileText, label: "Source", value: "BRMH" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">About the dataset</h1>
        <p className="text-muted-foreground max-w-2xl">
          Resting-state EEG recordings from the Bukhyun Research Mental Health (BRMH) clinical archive — one of the
          largest publicly described EEG datasets across mental disorder categories.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {facts.map((f) => (
          <Card key={f.label} className="p-5 gradient-card border-border shadow-soft">
            <f.icon className="h-5 w-5 text-primary mb-3" />
            <div className="text-3xl font-bold mb-1">{f.value}</div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{f.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-3 gradient-card border-border shadow-elevated">
          <h3 className="font-semibold mb-2">Class distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Approximate sample counts per disorder category.</p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={120} paddingAngle={2}>
                {dist.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--chart-${(i % 7) + 1}))`} stroke="hsl(var(--background))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 lg:col-span-2 gradient-card border-border shadow-elevated">
          <h3 className="font-semibold mb-3">Feature schema</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Identifiers (dropped)</p>
              <p className="text-xs text-muted-foreground">no., eeg.date</p>
            </div>
            <div>
              <p className="font-medium">Demographics</p>
              <p className="text-xs text-muted-foreground">sex, age, education, IQ</p>
            </div>
            <div>
              <p className="font-medium">Power features (AB.*)</p>
              <p className="text-xs text-muted-foreground">Absolute band power per region × band × channel</p>
            </div>
            <div>
              <p className="font-medium">Coherence (COH.*)</p>
              <p className="text-xs text-muted-foreground">Inter-channel coherence per frequency band</p>
            </div>
            <div>
              <p className="font-medium">Targets</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">main.disorder</Badge>
                <Badge variant="outline" className="text-xs">specific.disorder</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6 gradient-card border-border">
        <h3 className="font-semibold mb-3">Disorder classes predicted</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MODEL.classes.map((c, i) => (
            <div key={c} className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
              <div className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--chart-${(i % 7) + 1}))` }} />
              <span className="text-sm">{c}</span>
            </div>
          ))}
        </div>
      </Card>

      {MODEL.demo_note && (
        <Card className="mt-6 p-5 border-warning/40 bg-warning/5">
          <p className="text-xs text-foreground">
            <strong className="text-warning">Demo notice:</strong> {MODEL.demo_note}
          </p>
        </Card>
      )}
    </div>
  );
}
