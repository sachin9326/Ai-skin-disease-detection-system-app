import os
import json
import math
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_fscore_support

# ── Paths ──────────────────────────────────────────────────────────────────
DATASET_DIR = r"C:\Users\Sachin Kumar\Desktop\dataset HAM"
TRAIN_META_PATH = os.path.join(DATASET_DIR, "HAM10000_metadata")
TRAIN_IMG_DIR   = os.path.join(DATASET_DIR, "HAM 10,000")
TEST_META_PATH  = os.path.join(DATASET_DIR, "ISIC2018_Task3_Test_GroundTruth.csv")
TEST_IMG_DIR    = os.path.join(DATASET_DIR, "ISIC2018_Task3_Test_Images")

CLASS_NAMES = ['nv', 'mel', 'bkl', 'bcc', 'akiec', 'vasc', 'df']
CLASS_MAP = {c: i for i, c in enumerate(CLASS_NAMES)}

def extract_image_features_fast(img_path):
  """Extracts color, texture (GLCM proxy), asymmetry, BII, and scale features from an image."""
  try:
    with Image.open(img_path) as img:
      img = img.convert('RGB').resize((150, 150))
      arr = np.array(img, dtype=np.float32)
  except Exception:
    return np.zeros(16, dtype=np.float32)

  r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
  total_pixels = 150 * 150
  luma = 0.299 * r + 0.587 * g + 0.114 * b

  avg_r, avg_g, avg_b = np.mean(r), np.mean(g), np.mean(b)
  avg_l = np.mean(luma)

  # Peripheral luma (outer 15% margin)
  margin_h = int(150 * 0.15)
  margin_w = int(150 * 0.15)
  periph_mask = np.ones((150, 150), dtype=bool)
  periph_mask[margin_h:-margin_h, margin_w:-margin_w] = False
  periph_luma = np.mean(luma[periph_mask]) if np.any(periph_mask) else avg_l

  # Diagnostic Ratios
  red_dom = r - (g + b) / 2.0
  erythema_pixels = np.sum((r > g + 15) & (r > b + 15) & (red_dom > 15))
  erythema_ratio = erythema_pixels / total_pixels

  rel_dark_thresh = min(75.0, periph_luma * 0.68)
  dark_pixels = np.sum((luma < rel_dark_thresh) & ((r < 90) | (b < 70)))
  dark_ratio = dark_pixels / total_pixels

  depig_pixels = np.sum((luma > 185) & (np.abs(r - g) < 15) & (np.abs(r - b) < 15))
  depig_ratio = depig_pixels / total_pixels

  scale_pixels = np.sum((erythema_pixels > 0) & (luma > 160) & ((r - g) < 35))
  scale_ratio = scale_pixels / total_pixels

  pus_pixels = np.sum((r > 135) & (g > 115) & (b < 100) & ((r - b) > 40))
  pus_ratio = pus_pixels / total_pixels

  # Quadrant Asymmetry
  q1 = np.sum(luma[:75, :75] < rel_dark_thresh)
  q2 = np.sum(luma[:75, 75:] < rel_dark_thresh)
  q3 = np.sum(luma[75:, :75] < rel_dark_thresh)
  q4 = np.sum(luma[75:, 75:] < rel_dark_thresh)
  quads = [q1, q2, q3, q4]
  max_q, min_q, total_q = max(quads), min(quads), sum(quads)
  asymmetry = (max_q - min_q) / max(1, max_q) if total_q > 20 else 0.1

  # Texture Variance (GLCM contrast proxy)
  diff_x = np.abs(luma[:, 1:] - luma[:, :-1])
  diff_y = np.abs(luma[1:, :] - luma[:-1, :])
  texture_var = (np.mean(diff_x) + np.mean(diff_y)) / 2.0

  # Border Irregularity Index (BII proxy)
  lesion_mask = (luma < periph_luma - 15) | (luma > periph_luma + 25)
  lesion_count = np.sum(lesion_mask)
  if lesion_count > 30:
    rows = np.any(lesion_mask, axis=1)
    cols = np.any(lesion_mask, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    bounding_box_area = (rmax - rmin + 1) * (cmax - cmin + 1)
    bii = bounding_box_area / float(lesion_count)
    diameter_ratio = math.sqrt((rmax - rmin)**2 + (cmax - cmin)**2) / math.sqrt(150**2 + 150**2)
  else:
    bii = 1.05
    diameter_ratio = 0.05

  # Color std dev
  lesion_rgb = arr[lesion_mask] if lesion_count > 30 else arr.reshape(-1, 3)
  color_std = float(np.mean(np.std(lesion_rgb, axis=0)))

  return np.array([
    avg_r, avg_g, avg_b, avg_l, periph_luma,
    erythema_ratio, dark_ratio, depig_ratio, scale_ratio, pus_ratio,
    asymmetry, texture_var, bii, diameter_ratio, color_std, lesion_count / total_pixels
  ], dtype=np.float32)


def run_pipeline():
  print("=" * 70)
  print("SKINSCAN AI -- HAM10000 & ISIC2018 PATIENT-LEVEL TRAINING PIPELINE")
  print("=" * 70)

  # 1. Load Training Metadata
  print("\nStep 1: Loading HAM10000 Metadata...")
  df_train = pd.read_csv(TRAIN_META_PATH)
  print(f"Total training dataset records: {len(df_train)}")
  print(f"Unique patient lesion IDs: {df_train['lesion_id'].nunique()}")

  # 2. Strict Patient-Level Group Split
  print("\nStep 2: Executing Strict Patient-Level Split on 'lesion_id'...")
  gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
  train_idx, val_idx = next(gss.split(df_train, df_train['dx'], df_train['lesion_id']))

  df_tr = df_train.iloc[train_idx].copy()
  df_va = df_train.iloc[val_idx].copy()

  train_lesions = set(df_tr['lesion_id'])
  val_lesions = set(df_va['lesion_id'])
  overlap = train_lesions.intersection(val_lesions)

  print(f"Train set: {len(df_tr)} images across {len(train_lesions)} unique lesions")
  print(f"Validation set: {len(df_va)} images across {len(val_lesions)} unique lesions")
  print(f"Lesion ID Overlap Count: {len(overlap)} (MUST BE 0 -- DATA LEAKAGE FREE)")

  # 3. Extract Features for Training & Validation Set
  print("\nStep 3: Extracting Visual Features for Training Images...")
  X_train, y_train = [], []
  for idx, row in df_tr.iterrows():
    img_name = row['image_id'] + ".jpg"
    img_path = os.path.join(TRAIN_IMG_DIR, img_name)
    feat = extract_image_features_fast(img_path)
    X_train.append(feat)
    y_train.append(CLASS_MAP[row['dx']])

  X_train = np.array(X_train)
  y_train = np.array(y_train)

  print("Extracting Visual Features for Validation Images...")
  X_val, y_val = [], []
  for idx, row in df_va.iterrows():
    img_name = row['image_id'] + ".jpg"
    img_path = os.path.join(TRAIN_IMG_DIR, img_name)
    feat = extract_image_features_fast(img_path)
    X_val.append(feat)
    y_val.append(CLASS_MAP[row['dx']])

  X_val = np.array(X_val)
  y_val = np.array(y_val)

  # 4. Train Class-Weighted Ensemble Classifier
  print("\nStep 4: Training Class-Weighted RandomForest Ensemble Classifier...")
  base_clf = RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1
  )
  calibrated_clf = CalibratedClassifierCV(estimator=base_clf, cv=3)
  calibrated_clf.fit(X_train, y_train)

  # 5. Evaluate Validation Performance
  print("\nStep 5: Patient-Level Validation Split Performance Report:")
  val_preds = calibrated_clf.predict(X_val)
  val_probs = calibrated_clf.predict_proba(X_val)

  val_report = classification_report(y_val, val_preds, target_names=CLASS_NAMES, digits=4)
  print(val_report)

  val_cm = confusion_matrix(y_val, val_preds)
  print("Validation Confusion Matrix (7x7):")
  print(val_cm)

  val_auc = roc_auc_score(y_val, val_probs, multi_class='ovr', average='macro')
  print(f"Validation Macro AUC-ROC: {val_auc:.4f}")

  # 6. Evaluate Holdout Test Set (ISIC 2018 Task 3 Test)
  print("\nStep 6: Evaluating Strict Holdout Test Set (ISIC2018 Task 3 Test)...")
  df_test = pd.read_csv(TEST_META_PATH)
  print(f"Total holdout test records: {len(df_test)}")

  X_test, y_test = [], []
  for idx, row in df_test.iterrows():
    img_name = row['image_id'] + ".jpg"
    img_path = os.path.join(TEST_IMG_DIR, img_name)
    feat = extract_image_features_fast(img_path)
    X_test.append(feat)
    y_test.append(CLASS_MAP[row['dx']])

  X_test = np.array(X_test)
  y_test = np.array(y_test)

  test_preds = calibrated_clf.predict(X_test)
  test_probs = calibrated_clf.predict_proba(X_test)

  print("\nHOLDOUT TEST SET PERFORMANCE REPORT (ISIC 2018 Task 3):")
  test_report_text = classification_report(y_test, test_preds, target_names=CLASS_NAMES, digits=4)
  print(test_report_text)

  test_cm = confusion_matrix(y_test, test_preds)
  print("Holdout Test Confusion Matrix (7x7):")
  print(test_cm)

  test_auc = roc_auc_score(y_test, test_probs, multi_class='ovr', average='macro')
  print(f"Holdout Test Macro AUC-ROC: {test_auc:.4f}")

  # Calculate detailed per-class metrics
  prec, rec, f1, supp = precision_recall_fscore_support(y_test, test_preds)

  per_class_summary = []
  for i, c_name in enumerate(CLASS_NAMES):
    tp = int(test_cm[i, i])
    fn = int(np.sum(test_cm[i, :])) - tp
    fp = int(np.sum(test_cm[:, i])) - tp
    tn = int(np.sum(test_cm)) - (tp + fn + fp)
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0

    per_class_summary.append({
      'classId': c_name,
      'code': c_name.upper(),
      'name': c_name,
      'precision': round(float(prec[i]), 4),
      'recall': round(float(rec[i]), 4),
      'specificity': round(float(spec), 4),
      'f1Score': round(float(f1[i]), 4),
      'support': int(supp[i]),
      'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn
    })

  melanoma_rec = per_class_summary[1]['recall'] # mel index 1

  output_data = {
    'totalTrainImages': len(X_train),
    'totalValImages': len(X_val),
    'totalTestImages': len(X_test),
    'valMacroAuc': round(float(val_auc), 4),
    'testMacroAuc': round(float(test_auc), 4),
    'overallTestAccuracy': round(float(np.mean(test_preds == y_test)), 4),
    'melanomaRecall': round(float(melanoma_rec), 4),
    'melanomaSafetyPassed': bool(melanoma_rec >= 0.80),
    'perClass': per_class_summary,
    'confusionMatrix': test_cm.tolist()
  }

  out_json_path = os.path.join(os.path.dirname(__file__), 'ham10000_evaluation_report.json')
  with open(out_json_path, 'w') as f:
    json.dump(output_data, f, indent=2)

  print(f"\nEmpirical evaluation report saved to: {out_json_path}")
  return output_data

if __name__ == '__main__':
  run_pipeline()
