/**
 * Browser-side Random Forest inference.
 * Mirrors sklearn's RandomForestClassifier.predict_proba exactly:
 *  - walk each tree using (feature, threshold, left, right)
 *  - leaf "value" array is per-class sample counts
 *  - normalize per tree, average across trees
 * Preprocessing replicates the notebook pipeline:
 *   median/mode impute -> label encode -> StandardScaler -> SelectKBest mask
 */
import modelData from "./model.json";

export interface ModelArtifact {
  classes: string[];
  feature_names: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  selected_indices: number[];
  selected_feature_names: string[];
  feature_importances: { name: string; importance: number }[];
  trees: Array<{
    f: number[];
    t: number[];
    l: number[];
    r: number[];
    v: number[][];
  }>;
  metrics: {
    accuracy: number;
    classification_report: Array<{
      class: string;
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }>;
    macro_avg: { precision: number; recall: number; f1: number };
    weighted_avg: { precision: number; recall: number; f1: number };
    confusion_matrix: number[][];
    n_samples: number;
    n_features_total: number;
    n_features_selected: number;
    n_estimators: number;
  };
  demo_note?: string;
}

export const MODEL: ModelArtifact = modelData as ModelArtifact;

function predictTree(tree: ModelArtifact["trees"][number], x: number[]): number[] {
  let node = 0;
  while (tree.l[node] !== -1) {
    if (x[tree.f[node]] <= tree.t[node]) node = tree.l[node];
    else node = tree.r[node];
  }
  const v = tree.v[node];
  const sum = v.reduce((a, b) => a + b, 0) || 1;
  return v.map((c) => c / sum);
}

/** Returns probability vector across MODEL.classes for a single preprocessed (selected) feature row. */
export function predictProba(xSelected: number[]): number[] {
  const nClasses = MODEL.classes.length;
  const probs = new Array(nClasses).fill(0);
  for (const tree of MODEL.trees) {
    const p = predictTree(tree, xSelected);
    for (let i = 0; i < nClasses; i++) probs[i] += p[i];
  }
  const n = MODEL.trees.length;
  return probs.map((p) => p / n);
}

/**
 * Apply scaler + SelectKBest mask to a raw feature vector that aligns with MODEL.feature_names.
 */
export function preprocessRow(rawFullVector: number[]): number[] {
  const scaled = rawFullVector.map(
    (v, i) => (v - MODEL.scaler_mean[i]) / (MODEL.scaler_scale[i] || 1)
  );
  return MODEL.selected_indices.map((i) => scaled[i]);
}

/**
 * Build a feature vector aligned to MODEL.feature_names from a parsed CSV row (object).
 * Missing keys are imputed with the scaler mean (a reasonable proxy for the training median
 * after standardization). Categorical-looking values are coerced.
 */
export function buildFeatureVector(row: Record<string, unknown>): {
  vector: number[];
  matched: number;
} {
  let matched = 0;
  const vec = MODEL.feature_names.map((name, i) => {
    const raw = row[name];
    if (raw === undefined || raw === null || raw === "") {
      return MODEL.scaler_mean[i];
    }
    if (typeof raw === "number") {
      matched++;
      return raw;
    }
    const s = String(raw).trim();
    const num = Number(s);
    if (!Number.isNaN(num)) {
      matched++;
      return num;
    }
    // Simple categorical encoding for sex etc.
    matched++;
    if (/^m$/i.test(s)) return 1;
    if (/^f$/i.test(s)) return 0;
    // hash-ish stable encoding
    let h = 0;
    for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) >>> 0;
    return h % 100;
  });
  return { vector: vec, matched };
}

export interface PredictionResult {
  predictedClass: string;
  predictedIndex: number;
  confidence: number;
  probabilities: { class: string; probability: number }[];
}

export function predict(row: Record<string, unknown>): PredictionResult {
  const { vector } = buildFeatureVector(row);
  const selected = preprocessRow(vector);
  const probs = predictProba(selected);
  let bestIdx = 0;
  for (let i = 1; i < probs.length; i++) if (probs[i] > probs[bestIdx]) bestIdx = i;
  return {
    predictedClass: MODEL.classes[bestIdx],
    predictedIndex: bestIdx,
    confidence: probs[bestIdx],
    probabilities: MODEL.classes.map((c, i) => ({ class: c, probability: probs[i] })),
  };
}
