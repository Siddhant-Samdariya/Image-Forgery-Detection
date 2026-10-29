"""
Download a small random sample of AI-generated images from Synthbuster
(DALL-E 2/3, Midjourney v5, Firefly, Stable Diffusion 1.3/1.4/2/XL, GLIDE)
into test_images/fake.

The full dataset is a 12.4 GB zip on Zenodo, so this reads the zip remotely
and fetches only the files it needs (~1-2 MB each).

Usage:
    pip install remotezip
    python download_synthbuster.py
"""
import random
import shutil
import sys
from collections import defaultdict
from pathlib import Path

try:
    from remotezip import RemoteZip
except ImportError:
    sys.exit("Missing package. Run:  pip install remotezip")

PER_MODEL = 12   # images per generator (9 generators -> ~108 images)
SEED = 0
URL = "https://zenodo.org/records/10066460/files/synthbuster.zip?download=1"
IMG_EXTS = (".png", ".jpg", ".jpeg", ".webp")

fake_dir = Path(__file__).parent / "test_images" / "fake"
fake_dir.mkdir(parents=True, exist_ok=True)

stray = [p for p in fake_dir.iterdir()
         if p.is_file() and not p.name.startswith(("sb_", "own_", "."))]
if stray:
    print(f"fake/ contains {len(stray)} other files (e.g. {stray[0].name}).")
    print("Move them out first so your test set is not mixed, then re-run.")
    sys.exit(1)

try:
    zf = RemoteZip(URL)
except Exception as e:
    print(f"Could not open the remote zip ({type(e).__name__}: {e}).")
    print("Manual option: download synthbuster.zip (12.4 GB) from")
    print("https://zenodo.org/records/10066460 and extract a few files per folder.")
    sys.exit(1)

with zf:
    groups = defaultdict(list)
    for name in zf.namelist():
        if name.lower().endswith(IMG_EXTS) and not name.startswith("__MACOSX"):
            groups[Path(name).parent.name].append(name)

    print("Generators found:", ", ".join(f"{g} ({len(v)})" for g, v in sorted(groups.items())))
    rng = random.Random(SEED)
    total = 0
    for gen in sorted(groups):
        names = sorted(groups[gen])
        for name in rng.sample(names, min(PER_MODEL, len(names))):
            dst = fake_dir / f"sb_{gen.replace(' ', '_')}_{Path(name).name}"
            if not dst.exists():
                with zf.open(name) as src, open(dst, "wb") as out:
                    shutil.copyfileobj(src, out)
            total += 1
            print(f"\r  {total} images", end="", flush=True)
    print()

print(f"Done. {len(list(fake_dir.glob('sb_*')))} Synthbuster images in {fake_dir}")