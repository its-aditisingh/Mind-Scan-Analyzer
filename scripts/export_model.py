"""
Export script — replace the bundled demo model with the REAL one trained on
EEG.machinelearing_data_BRMH.csv.

Usage:
    pip install scikit-learn pandas numpy
    python scripts/export_model.py path/to/EEG.machinelearing_data_BRMH.csv

Outputs: src/model/model.json (overwrites bundle)
"""
import sys, json, os, numpy as np, pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

CSV = sys.argv[1]
df = pd.read_csv(CSV)
df.drop(columns=['no.', 'eeg.date'], inplace=True, errors='ignore')

target = 'main.disorder'
y_raw = df[target].astype(str)
X = df.drop(columns=[target, 'specific.disorder'], errors='ignore')
X = X.dropna(axis=1, how='all')

num_cols = X.select_dtypes(include=['float64','int64']).columns
cat_cols = X.select_dtypes(include=['object']).columns

X[num_cols] = SimpleImputer(strategy='median').fit_transform(X[num_cols])
if len(cat_cols):
    X[cat_cols] = SimpleImputer(strategy='most_frequent').fit_transform(X[cat_cols])
    for col in cat_cols:
        X[col] = LabelEncoder().fit_transform(X[col].astype(str))

target_le = LabelEncoder().fit(y_raw)
y = target_le.transform(y_raw)
classes = target_le.classes_.tolist()

feature_names = X.columns.tolist()
scaler = StandardScaler().fit(X.values)
Xs = scaler.transform(X.values)

X_train, X_test, y_train, y_test = train_test_split(
    Xs, y, test_size=0.2, random_state=42, stratify=y)

selector = SelectKBest(f_classif, k=10).fit(X_train, y_train)
mask = selector.get_support(indices=True).tolist()
sel_names = [feature_names[i] for i in mask]

clf = RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1,
                             class_weight='balanced').fit(selector.transform(X_train), y_train)
y_pred = clf.predict(selector.transform(X_test))
acc = float(accuracy_score(y_test, y_pred))
report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
cm = confusion_matrix(y_test, y_pred).tolist()

def export_tree(t):
    return {"f": t.feature.tolist(),
            "t": [float(x) for x in t.threshold],
            "l": t.children_left.tolist(),
            "r": t.children_right.tolist(),
            "v": [[float(v) for v in row[0]] for row in t.value]}

artifact = {
  "classes": classes,
  "feature_names": feature_names,
  "scaler_mean": scaler.mean_.tolist(),
  "scaler_scale": scaler.scale_.tolist(),
  "selected_indices": mask,
  "selected_feature_names": sel_names,
  "feature_importances": sorted(
      [{"name": n, "importance": float(i)} for n, i in zip(sel_names, clf.feature_importances_)],
      key=lambda d: -d["importance"]),
  "trees": [export_tree(e.tree_) for e in clf.estimators_],
  "metrics": {
      "accuracy": acc,
      "classification_report": [
          {"class": c, "precision": report[str(i)]["precision"],
           "recall": report[str(i)]["recall"], "f1": report[str(i)]["f1-score"],
           "support": int(report[str(i)]["support"])}
          for i, c in enumerate(classes)],
      "macro_avg": {"precision": report["macro avg"]["precision"],
                    "recall": report["macro avg"]["recall"], "f1": report["macro avg"]["f1-score"]},
      "weighted_avg": {"precision": report["weighted avg"]["precision"],
                       "recall": report["weighted avg"]["recall"], "f1": report["weighted avg"]["f1-score"]},
      "confusion_matrix": cm,
      "n_samples": len(df), "n_features_total": len(feature_names),
      "n_features_selected": 10, "n_estimators": 300,
  },
}

os.makedirs("src/model", exist_ok=True)
with open("src/model/model.json", "w") as f:
    json.dump(artifact, f, separators=(",", ":"))
print(f"Exported model.json — accuracy={acc:.4f}, size={os.path.getsize('src/model/model.json')//1024} KB")
