from pathlib import Path
from PIL import Image
from transformers import pipeline

detector = pipeline(
    "image-classification",
    model="dima806/ai_vs_real_image_detection",
)

base = Path(__file__).parent / "test_images"
exts = {".jpg", ".jpeg", ".png", ".webp"}

# which group should be classified as which label
groups = {"real": "REAL", "fake": "FAKE", "real_resized": "REAL", "fake_resized": "FAKE"}

for group, expected in groups.items():
    folder = base / group
    if not folder.exists():
        continue
    correct = total = 0
    for path in sorted(folder.iterdir()):
        if path.suffix.lower() not in exts:
            continue
        img = Image.open(path).convert("RGB")
        top = detector(img)[0]
        total += 1
        ok = top["label"].upper() == expected
        correct += ok
        print(f"  {group}/{path.name}: {top['label']} ({top['score']:.2f}) {'OK' if ok else 'WRONG'}")
    if total:
        print(f"{group}: {correct}/{total} correct ({100*correct/total:.0f}%)\n")