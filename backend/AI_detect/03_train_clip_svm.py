"""Train the paper's detector: CLIP next-to-last features + linear SVM.
  plain : clean reference images
  aug   : "+" variant, some reference images are cropped/resized/JPEG-compressed
Usage: python 03_train_clip_svm.py [--variant plain|aug|both]"""
import argparse
import numpy as np
import joblib
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import LinearSVC

import config
from common import load_clip, extract_features

ap = argparse.ArgumentParser()
ap.add_argument("--variant", default="both", choices=["plain", "aug", "both"])
args = ap.parse_args()

# ---- paired real/fake lists -------------------------------------------------
real_paths, fake_paths = [], []
for r in sorted(config.TRAIN_REAL.iterdir()):
    f = config.TRAIN_FAKE / f"fake_{r.stem}.png"
    if f.exists():
        real_paths.append(r)
        fake_paths.append(f)
n = len(real_paths)
assert n >= 10, "Run scripts 01 and 02 first."
print(f"{n} real/fake training pairs")

y = np.array([0] * n + [1] * n)
groups = np.array(list(range(n)) * 2)      # keep a pair in the same CV fold
paths = real_paths + fake_paths

model, device = load_clip()
variants = ["plain", "aug"] if args.variant == "both" else [args.variant]

for v in variants:
    cache = config.CACHE / f"train_{v}_n{n}.npz"
    if cache.exists():
        X = np.load(cache)["X"]
    else:
        print(f"Extracting features ({v})...")
        X = extract_features(paths, model, device,
                             augment=(v == "aug"), aug_prob=0.5, seed=config.SEED)
        np.savez(cache, X=X)

    pipe = make_pipeline(StandardScaler(), LinearSVC(max_iter=20000))
    cv = GroupKFold(n_splits=5)
    gs = GridSearchCV(pipe, {"linearsvc__C": [0.001, 0.01, 0.1, 1, 10]},
                      scoring="roc_auc", cv=cv.split(X, y, groups), n_jobs=1)
    gs.fit(X, y)
    print(f"[{v}] best C={gs.best_params_['linearsvc__C']}  "
          f"CV AUC (train data only)={gs.best_score_:.3f}")
    joblib.dump(gs.best_estimator_, config.MODELS / f"clip_svm_{v}.joblib")

print("Models saved in", config.MODELS)