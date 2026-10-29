"""Evaluate the CLIP+SVM models on your test set with the same metrics as the
HF baseline: per-group acc, balanced acc, FPR, FNR, AUC at a FIXED threshold.
SVM decision score > 0 means FAKE (the SVM analogue of the 0.5 threshold)."""
import csv
import joblib
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import config
from common import (load_clip, list_images, extract_features,
                    compute_metrics, group_of)

# Your earlier HF baseline numbers (from your handoff), for the comparison plot
HF = {"clean": dict(bal_acc=0.558, auc=0.712),
      "resized": dict(bal_acc=0.559, auc=0.705)}

CONDITIONS = {"clean": ("real", "fake"),
              "resized": ("real_resized", "fake_resized")}
VARIANTS = ["plain", "aug"]

model, device = load_clip()

# extract test features once per condition
data = {}
for cond, (rd, fd) in CONDITIONS.items():
    rp = list_images(config.TEST_ROOT / rd)
    fp = list_images(config.TEST_ROOT / fd)
    print(f"{cond}: {len(rp)} real, {len(fp)} fake")
    X = extract_features(rp + fp, model, device)
    y = np.array([0] * len(rp) + [1] * len(fp))
    names = [p.name for p in rp + fp]
    groups = [group_of(n, bool(l)) for n, l in zip(names, y)]
    data[cond] = (X, y, names, groups)

summary, per_gen, per_image = [], [], []
for v in VARIANTS:
    clf = joblib.load(config.MODELS / f"clip_svm_{v}.joblib")
    for cond, (X, y, names, groups) in data.items():
        s = clf.decision_function(X)
        m = compute_metrics(y, s)
        summary.append(dict(variant=v, condition=cond, **m))
        groups_arr = np.array(groups)
        for g in sorted(set(groups_arr[y == 1])):
            mask = (y == 0) | (groups_arr == g)
            mg = compute_metrics(y[mask], s[mask])
            per_gen.append(dict(variant=v, condition=cond, generator=g,
                                n_fake=mg["n_fake"], fake_acc=mg["fake_acc"],
                                auc_vs_all_real=mg["auc"]))
        for n, l, g, sc in zip(names, y, groups, s):
            per_image.append(dict(variant=v, condition=cond, file=n,
                                  label=int(l), group=g, score=float(sc),
                                  pred_fake=int(sc > 0)))


def write_csv(rows, path):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


write_csv(summary, config.RESULTS / "clip_summary.csv")
write_csv(per_gen, config.RESULTS / "clip_per_generator.csv")
write_csv(per_image, config.RESULTS / "clip_per_image.csv")

print("\n=== SUMMARY (threshold fixed, no calibration) ===")
print(f"{'variant':8s}{'cond':9s}{'realAcc':>9s}{'fakeAcc':>9s}{'balAcc':>8s}"
      f"{'FPR':>7s}{'FNR':>7s}{'AUC':>7s}")
for r in summary:
    print(f"{r['variant']:8s}{r['condition']:9s}{r['real_acc']:9.3f}{r['fake_acc']:9.3f}"
          f"{r['bal_acc']:8.3f}{r['fpr']:7.3f}{r['fnr']:7.3f}{r['auc']:7.3f}")
for c, h in HF.items():
    print(f"{'HF':8s}{c:9s}{'':9s}{'':9s}{h['bal_acc']:8.3f}{'':7s}{'':7s}{h['auc']:7.3f}")

print("\n=== PER GENERATOR (fake acc / AUC) ===")
for r in per_gen:
    print(f"{r['variant']:6s}{r['condition']:9s}{r['generator']:22s}"
          f"n={r['n_fake']:3d}  acc={r['fake_acc']:.2f}  auc={r['auc_vs_all_real']:.3f}")

# ---- comparison plot ---------------------------------------------------------
fig, axes = plt.subplots(1, 2, figsize=(11, 4))
labels = ["HF baseline", "CLIP+SVM plain", "CLIP+SVM aug (+)"]
for ax, metric, title in zip(axes, ["bal_acc", "auc"],
                             ["Balanced accuracy", "AUC"]):
    width = 0.35
    for j, cond in enumerate(["clean", "resized"]):
        vals = [HF[cond][metric]]
        for v in VARIANTS:
            vals.append(next(r[metric] for r in summary
                             if r["variant"] == v and r["condition"] == cond))
        ax.bar(np.arange(3) + j * width, vals, width, label=cond)
    ax.set_xticks(np.arange(3) + width / 2)
    ax.set_xticklabels(labels, fontsize=8)
    ax.set_ylim(0.4, 1.0)
    ax.axhline(0.5, color="gray", ls="--", lw=0.8)
    ax.set_title(title)
    ax.legend()
plt.tight_layout()
plt.savefig(config.RESULTS / "clip_vs_hf.png", dpi=150)
print("\nSaved results to", config.RESULTS)