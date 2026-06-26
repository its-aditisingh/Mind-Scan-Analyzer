import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { toast } from "sonner";
import { predict, MODEL, type PredictionResult } from "@/model/inference";

interface Row { [k: string]: unknown }

interface RunResult {
  rowIndex: number;
  preview: Record<string, unknown>;
  result: PredictionResult;
}

export default function Predict() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RunResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFile(f);
    setResults([]);
    Papa.parse<Row>(f, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (res) => {
        const data = (res.data || []).filter((r) => r && Object.keys(r).length > 1);
        setRows(data);
        toast.success(`Parsed ${data.length} rows from ${f.name}`);
      },
      error: (err) => toast.error(`Parse error: ${err.message}`),
    });
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const runPredictions = async () => {
    if (!rows.length) return;
    setLoading(true);
    setProgress(0);
    const out: RunResult[] = [];
    const batch = 25;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const result = predict(r as Record<string, unknown>);
      out.push({ rowIndex: i, preview: r as Record<string, unknown>, result });
      if (i % batch === 0) {
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        await new Promise((res) => setTimeout(res, 0));
      }
    }
    setProgress(100);
    setResults(out);
    setSelectedIdx(0);
    setLoading(false);
    toast.success(`Generated ${out.length} predictions`);
  };

  const downloadResults = () => {
    const csv = Papa.unparse(
      results.map((r) => ({
        row: r.rowIndex + 1,
        predicted_disorder: r.result.predictedClass,
        confidence: r.result.confidence.toFixed(4),
        ...Object.fromEntries(
          r.result.probabilities.map((p) => [`prob_${p.class.replace(/\s+/g, "_")}`, p.probability.toFixed(4)])
        ),
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "neuroscan_predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    // Fabricate a single sample row aligned with the model so users can try without a CSV
    const sampleRow: Record<string, number> = {};
    MODEL.feature_names.forEach((name, i) => {
      sampleRow[name] = MODEL.scaler_mean[i] + (Math.random() - 0.5) * MODEL.scaler_scale[i];
    });
    setFile(null);
    setRows([sampleRow]);
    setResults([]);
    toast.success("Loaded a synthetic sample row");
  };

  const selected = results[selectedIdx];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Upload & Predict</h1>
        <p className="text-muted-foreground">
          Drop a CSV with EEG features (matching the BRMH schema) and the model will return per-row disorder predictions.
        </p>
      </div>

      {/* Dropzone */}
      <Card
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`p-10 border-2 border-dashed cursor-pointer transition-smooth gradient-card
          ${dragActive ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Drop your EEG CSV here</h3>
          <p className="text-sm text-muted-foreground mb-4">or click to browse · max 20 MB</p>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); loadSample(); }}>
            Try with sample data
          </Button>
        </div>
      </Card>

      {/* File summary */}
      {(file || rows.length > 0) && (
        <Card className="mt-4 p-4 flex items-center justify-between gradient-card animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{file?.name || "Sample row"}</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} row{rows.length !== 1 ? "s" : ""} · {rows.length ? Object.keys(rows[0]).length : 0} columns
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={runPredictions} disabled={loading || !rows.length} className="gradient-hero text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run prediction"}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setFile(null); setRows([]); setResults([]); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {loading && (
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">Predicting row {Math.round((progress / 100) * rows.length)} / {rows.length}</p>
        </div>
      )}

      {/* Results */}
      {selected && (
        <div className="mt-8 grid lg:grid-cols-3 gap-4 animate-fade-in">
          {/* Left: prediction card */}
          <Card className="p-6 gradient-card border-border shadow-elevated">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              {selected.result.confidence > 0.6 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-warning" />
              )}
              <span>Row {selected.rowIndex + 1} prediction</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{selected.result.predictedClass}</h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gradient">
                {(selected.result.confidence * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">confidence</span>
            </div>
            <Progress value={selected.result.confidence * 100} className="h-2" />

            <div className="mt-6 pt-6 border-t border-border space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top features used</p>
              {MODEL.selected_feature_names.slice(0, 5).map((n) => (
                <Badge key={n} variant="secondary" className="mr-1 mb-1 font-mono text-[10px]">
                  {n}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Right: probability chart */}
          <Card className="p-6 lg:col-span-2 gradient-card border-border shadow-elevated">
            <h3 className="font-semibold mb-4">Probability across all 7 classes</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={selected.result.probabilities} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="class" type="category" width={170} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => `${(v * 100).toFixed(2)}%`}
                />
                <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                  {selected.result.probabilities.map((p, i) => (
                    <Cell key={i} fill={i === selected.result.predictedIndex ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Results table */}
      {results.length > 1 && (
        <Card className="mt-6 gradient-card border-border animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">All predictions ({results.length})</h3>
            <Button variant="outline" size="sm" onClick={downloadResults}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Predicted disorder</TableHead>
                  <TableHead className="w-32">Confidence</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow
                    key={i}
                    className={`cursor-pointer ${selectedIdx === i ? "bg-primary/5" : ""}`}
                    onClick={() => setSelectedIdx(i)}
                  >
                    <TableCell className="font-mono text-xs">{r.rowIndex + 1}</TableCell>
                    <TableCell className="font-medium">{r.result.predictedClass}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.result.confidence * 100} className="h-1.5 w-20" />
                        <span className="text-xs text-muted-foreground">
                          {(r.result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar />
          </ScrollArea>
        </Card>
      )}

      {/* Sample preview */}
      {rows.length > 0 && !results.length && (
        <Card className="mt-6 gradient-card border-border animate-fade-in">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Data preview</h3>
            <p className="text-xs text-muted-foreground">First 5 rows · first 8 columns</p>
          </div>
          <ScrollArea className="max-h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(rows[0]).slice(0, 8).map((k) => (
                    <TableHead key={k} className="font-mono text-xs">{k}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 5).map((r, i) => (
                  <TableRow key={i}>
                    {Object.keys(rows[0]).slice(0, 8).map((k) => (
                      <TableCell key={k} className="font-mono text-xs">
                        {String(r[k] ?? "—").slice(0, 20)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
