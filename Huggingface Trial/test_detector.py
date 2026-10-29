"""
Evaluate dima806/ai_vs_real_image_detection on a folder of test images.

Expected layout (next to this script):
    test_images/
        real/            real photos
        fake/            AI-generated images
        real_resized/    auto-generated from real/ (crop + resize + JPEG)
        fake_resized/    auto-generated from fake/

Usage:
    python test_detector.py                      # uses test_images/
    python test_detector.py --root test_images_cifake
    python test_detector.py --regen              # rebuild the *_resized folders

Optional extras for AUC and the chart:  pip install scikit-learn matplotlib
"""
import argparse
import csv
import random
from pathlib import Path

import torch
from PIL import Image
from tqdm import tqdm
from transformers import pipeline

MODEL = "dima806/ai_vs_real_image_detection"
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
THRESHOLD = 0.5      # fixed threshold, as in the paper (no calibration)
BATCH = 16
DEVICE = "mps" if torch.backends.mps.is_available() else (
    "cuda" if torch.cuda.is_available() else "cpu")   # set to "cpu" if mps errors

GROUPS = [  # (folder, true label)
    ("real", "REAL"),
    ("fake", "FAKE"),
    ("real_resized", "REAL"),
    ("fake_resized", "FAKE"),
]

parser = argparse.ArgumentParser()
parser.add_argument("--root", default="test_images")
parser.add_argument("--regen", action="store_true", help="rebuild *_resized folders")
args = parser.parse_args()

here = Path(__file__).parent
root = Path(args.root)
if not root.is_absolute():
    root = here / root
out_dir = here / f"results_{root.name}"
out_dir.mkdir(exist_ok=True)


def list_images(folder):
    if not folder.exists():
        return []
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in EXTS)


# ---------- degraded copies (paper-style: random crop, 200x200, JPEG 65-100) ----------
def make_resized(src_name, dst_name):
    src, dst = root / src_name, root / dst_name
    sources = list_images(src)
    if not sources:
        return
    dst.mkdir(exist_ok=True)
    existing = list_images(dst)
    if existing and not args.regen:
        return
    for p in existing:
        p.unlink()
    for p in tqdm(sources, desc=f"making {dst_name}", leave=False):
        rng = random.Random(p.name)            # deterministic per image
        img = Image.open(p).convert("RGB")
        w, h = img.size
        s = rng.uniform(5 / 8, 1.0)
        cw, ch = max(1, int(w * s)), max(1, int(h * s))
        x, y = rng.randint(0, w - cw), rng.randint(0, h - ch)
        img = img.crop((x, y, x + cw, y + ch)).resize((200, 200), Image.BICUBIC)
        img.save(dst / f"{p.stem}.jpg", quality=rng.randint(65, 100))


make_resized("real", "real_resized")
make_resized("fake", "fake_resized")

# ---------- model ----------
print(f"Loading model on {DEVICE}...")
detector = pipeline("image-classification", model=MODEL, device=DEVICE)


def p_fake(output):
    for d in output:
        if d["label"].upper() == "FAKE":
            return d["score"]
    raise ValueError(f"No FAKE label in {output}")


def score_folder(name):
    paths = list_images(root / name)
    rows = []
    for i in tqdm(range(0, len(paths), BATCH), desc=f"scoring {name}", leave=False):
        imgs, ok = [], []
        for p in paths[i:i + BATCH]:
            try:
                imgs.append(Image.open(p).convert("RGB"))
                ok.append(p)
            except Exception as e:
                print(f"skipping {p.name}: {e}")
        if imgs:
            for p, o in zip(ok, detector(imgs, batch_size=BATCH)):
                rows.append((p.name, p_fake(o)))
    return rows


results = {}
for name, expected in GROUPS:
    rows = score_folder(name)
    if rows:
        results[name] = (expected, rows)


def is_correct(expected, p):
    return (p >= THRESHOLD) == (expected == "FAKE")


# ---------- per-group table ----------
print("\n" + "=" * 52)
print(f"{'GROUP':<14}{'N':>5}{'ACCURACY':>12}{'AVG P(fake)':>14}")
print("-" * 52)
for name, (expected, rows) in results.items():
    n = len(rows)
    acc = sum(is_correct(expected, p) for _, p in rows) / n
    avg = sum(p for _, p in rows) / n
    print(f"{name:<14}{n:>5}{acc:>11.1%}{avg:>14.3f}")
print("=" * 52)


# ---------- real-vs-fake summaries ----------
def summarize(label, real_name, fake_name):
    if real_name not in results or fake_name not in results:
        print(f"\n{label}: skipped (need both {real_name}/ and {fake_name}/ filled)")
        return
    real = results[real_name][1]
    fake = results[fake_name][1]
    tnr = sum(p < THRESHOLD for _, p in real) / len(real)
    tpr = sum(p >= THRESHOLD for _, p in fake) / len(fake)
    print(f"\n{label}")
    print(f"  Balanced accuracy        : {(tnr + tpr) / 2:.1%}")
    print(f"  Real flagged as AI (FPR) : {1 - tnr:.1%}")
    print(f"  AI missed as real (FNR)  : {1 - tpr:.1%}")
    try:
        from sklearn.metrics import roc_auc_score
        y = [0] * len(real) + [1] * len(fake)
        auc = roc_auc_score(y, [p for _, p in real + fake])
        print(f"  AUC                      : {auc:.1%}")
    except ImportError:
        print("  AUC                      : (pip install scikit-learn)")


summarize("CLEAN IMAGES", "real", "fake")
summarize("COMPRESSED / RESIZED IMAGES", "real_resized", "fake_resized")

# ---------- save CSV ----------
csv_path = out_dir / "results.csv"
with open(csv_path, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["group", "file", "true_label", "p_fake", "predicted", "correct"])
    for name, (expected, rows) in results.items():
        for fname, p in rows:
            w.writerow([name, fname, expected, f"{p:.4f}",
                        "FAKE" if p >= THRESHOLD else "REAL", is_correct(expected, p)])
print(f"\nPer-image scores saved to {csv_path}")

# ---------- chart ----------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:
    print("Install matplotlib (pip install matplotlib) to get a chart.")
else:
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))

    names = list(results)
    accs = [sum(is_correct(e, p) for _, p in r) / len(r) * 100 for e, r in results.values()]
    colors = ["#4c78a8" if "real" in n else "#e45756" for n in names]
    bars = ax1.bar(names, accs, color=colors)
    ax1.axhline(50, color="gray", ls="--", lw=1)
    ax1.set_ylim(0, 105)
    ax1.set_ylabel("Accuracy (%)")
    ax1.set_title("Accuracy per group (dashed = coin flip)")
    for b, a in zip(bars, accs):
        ax1.text(b.get_x() + b.get_width() / 2, a + 1.5, f"{a:.0f}%", ha="center")
    ax1.tick_params(axis="x", rotation=15)

    for name, color in [("real", "#4c78a8"), ("fake", "#e45756"),
                        ("real_resized", "#9ecae9"), ("fake_resized", "#ff9d98")]:
        if name in results:
            ax2.hist([p for _, p in results[name][1]], bins=20, range=(0, 1),
                     alpha=0.55, color=color, label=name)
    ax2.axvline(THRESHOLD, color="black", ls="--", lw=1)
    ax2.set_xlabel("P(fake) assigned by model")
    ax2.set_ylabel("Number of images")
    ax2.set_title("Score distributions")
    ax2.legend()

    fig.suptitle(f"{MODEL}  |  data: {root.name}")
    fig.tight_layout()
    png = out_dir / "results.png"
    fig.savefig(png, dpi=150)
    print(f"Chart saved to {png}")