"""
Download N random real photos from COCO val2017 into test_images/real.

Usage (from anywhere):
    pip install remotezip        # lets us fetch only N files instead of the 1 GB zip
    python "Huggingface Trial/download_coco.py"

If remotezip is missing or the server refuses partial downloads, the script
falls back to downloading the full ~1 GB zip once, then extracting N files.
"""
import random
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

N = 100          # how many real images you want
SEED = 0         # same seed -> same images every run
# COCO's image server has a mismatched HTTPS certificate, so the official
# download links use plain http (fine for a public dataset).
URL = "http://images.cocodataset.org/zips/val2017.zip"

here = Path(__file__).parent
real_dir = here / "test_images" / "real"
real_dir.mkdir(parents=True, exist_ok=True)

# Safety: don't mix COCO with other images (e.g. leftover CIFAKE files)
stray = [p for p in real_dir.iterdir()
         if p.is_file() and not p.name.startswith(("coco_", "."))]
if stray:
    print(f"real/ already contains {len(stray)} non-COCO files (e.g. {stray[0].name}).")
    print("Move them out first so your test set is not mixed, then re-run.")
    sys.exit(1)


def pick(names):
    names = sorted(n for n in names if n.lower().endswith(".jpg"))
    return random.Random(SEED).sample(names, N)


def extract(zf, names):
    for i, n in enumerate(names, 1):
        dst = real_dir / f"coco_{Path(n).name}"
        if not dst.exists():
            with zf.open(n) as src, open(dst, "wb") as out:
                shutil.copyfileobj(src, out)
        print(f"\r  {i}/{len(names)} images", end="", flush=True)
    print()


def via_remotezip():
    from remotezip import RemoteZip
    print("Fetching only the files we need (remotezip)...")
    with RemoteZip(URL) as zf:
        extract(zf, pick(zf.namelist()))


def via_full_download():
    zip_path = here / "val2017.zip"
    if not zip_path.exists():
        print("Downloading full val2017.zip (~1 GB), this can take a while...")

        def progress(blocks, bsize, total):
            if total > 0:
                pct = min(100, blocks * bsize * 100 / total)
                print(f"\r  {pct:5.1f}%", end="", flush=True)

        urllib.request.urlretrieve(URL, zip_path, progress)
        print()
    with zipfile.ZipFile(zip_path) as zf:
        extract(zf, pick(zf.namelist()))
    print(f"You can delete {zip_path.name} now to free ~1 GB.")


try:
    via_remotezip()
except Exception as e:  # ImportError, network, or no range-request support
    print(f"Partial download not available ({type(e).__name__}: {e}).")
    via_full_download()

print(f"Done. {len(list(real_dir.glob('coco_*.jpg')))} COCO images in {real_dir}")