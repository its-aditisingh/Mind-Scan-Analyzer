import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MODEL } from "@/model/inference";
import { TrendingUp, Target, Activity, Layers } from "lucide-react";

export default function Performance() {
  const m = MODEL.metrics;
  const max = Math.max(...m.confusion_matrix.flat());

  const stats = [
    { icon: Target, label: "Accuracy", value: `${(m.accuracy * 100).toFixed(2)}%`, sub: "On 189 held-out samples" },
    { icon: TrendingUp, label: "Macro F1", value: m.macro_avg.f1.toFixed(2), sub: "Unweighted mean across classes" },
    { icon: Activity, label: "Weighted F1", value: m.weighted_avg.f1.toFixed(2), sub: "Weighted by class support" },
    { icon: Layers, label: "Trees / Features", value: `${m.n_estimators} / ${m.n_features_selected}`, sub: `From ${m.n_features_total} originally` },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Model performance</h1>
        <p className="text-muted-foreground">
          Evaluation results on the BRMH test set (20% stratified split, random_state=42).
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 gradient-card border-border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-gradient mb-1">{s.value}</div>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Confusion matrix */}
        <Card className="p-6 gradient-card border-border shadow-elevated">
          <h3 className="font-semibold mb-1">Confusion matrix</h3>
          <p className="text-xs text-muted-foreground mb-5">Rows = true class · columns = predicted</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {MODEL.classes.map((c, i) => (
                    <th key={i} className="p-1 font-medium text-muted-foreground" style={{ writingMode: "vertical-rl", height: 100 }}>
                      <span className="rotate-180 inline-block">{c}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="p-1 pr-2 text-right text-muted-foreground font-medium max-w-[140px] truncate" title={MODEL.classes[i]}>
                      {MODEL.classes[i]}
                    </td>
                    {row.map((v, j) => {
                      const intensity = v === 0 ? 0 : v / max;
                      const isDiag = i === j;
                      return (
                        <td
                          key={j}
                          className="p-0 border border-background"
                          title={`${MODEL.classes[i]} → ${MODEL.classes[j]}: ${v}`}
                        >
                          <div
                            className="aspect-square flex items-center justify-center font-mono text-xs transition-smooth hover:scale-110 hover:z-10 relative rounded"
                            style={{
                              background: isDiag
                                ? `hsl(var(--success) / ${0.15 + intensity * 0.75})`
                                : intensity > 0
                                ? `hsl(var(--destructive) / ${0.15 + intensity * 0.6})`
                                : "hsl(var(--muted) / 0.3)",
                              color: intensity > 0.5 ? "white" : "hsl(var(--foreground))",
                              minWidth: 28,
                              minHeight: 28,
                            }}
                          >
                            {v}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Per-class report */}
        <Card className="p-6 gradient-card border-border shadow-elevated">
          <h3 className="font-semibold mb-1">Classification report</h3>
          <p className="text-xs text-muted-foreground mb-5">Per-class precision, recall, F1-score</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Prec.</TableHead>
                <TableHead className="text-right">Rec.</TableHead>
                <TableHead className="text-right">F1</TableHead>
                <TableHead className="text-right">N</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {m.classification_report.map((c) => (
                <TableRow key={c.class}>
                  <TableCell className="font-medium text-xs max-w-[160px] truncate" title={c.class}>{c.class}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{c.precision.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{c.recall.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={c.f1 >= 0.97 ? "default" : "secondary"} className="font-mono text-xs">
                      {c.f1.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{c.support}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
