import io
import re
import numpy as np
import torch
from PIL import Image
from sklearn.metrics import roc_auc_score
from torchvision import transforms as T

import config

MEAN = (0.48145466, 0.4578275, 0.40821073)
STD = (0.26862954, 0.26130258, 0.27577711)
PREPROCESS = T.Compose([
    T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC),  # plain resizing, no crop
    T.ToTensor(),
    T.Normalize(MEAN, STD),
])


def get_device():
    if torch.backends.mps.is_available():
        return "mps"
    return "cuda" if torch.cuda.is_available() else "cpu"


def list_images(folder):
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in config.IMG_EXT)


def load_clip():
    """CLIP ViT-L/14 image encoder returning NEXT-TO-LAST layer features.

    open_clip's visual tower ends with: CLS token -> ln_post -> proj (1024 -> 768).
    The final embedding is the projection output; the next-to-last layer is the
    1024-d vector right before it, so we drop the projection.
    """
    import open_clip
    device = get_device()
    model, _, _ = open_clip.create_model_and_transforms(
        config.CLIP_ARCH, pretrained=config.CLIP_PRETRAINED)
    model.visual.proj = None
    return model.eval().to(device), device


def augment_image(img, rng):
    """Paper-style post-processing: random crop (5/8..full), resize 200x200,
    JPEG with random quality in [65, 100]."""
    w, h = img.size
    f = rng.uniform(5 / 8, 1.0)
    cw, ch = max(1, int(w * f)), max(1, int(h * f))
    x0 = int(rng.integers(0, w - cw + 1))
    y0 = int(rng.integers(0, h - ch + 1))
    img = img.crop((x0, y0, x0 + cw, y0 + ch)).resize((200, 200), Image.BICUBIC)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=int(rng.integers(65, 101)))
    buf.seek(0)
    return Image.open(buf).convert("RGB")


@torch.no_grad()
def extract_features(paths, model, device, augment=False, aug_prob=0.5,
                     seed=0, batch_size=32):
    rng = np.random.default_rng(seed)
    feats = []
    for i in range(0, len(paths), batch_size):
        batch = []
        for p in paths[i:i + batch_size]:
            img = Image.open(p).convert("RGB")
            if augment and rng.random() < aug_prob:
                img = augment_image(img, rng)
            batch.append(PREPROCESS(img))
        x = torch.stack(batch).to(device)
        f = model.encode_image(x)
        feats.append(f.float().cpu().numpy())
        print(f"  features {min(i + batch_size, len(paths))}/{len(paths)}", end="\r")
    print()
    out = np.concatenate(feats)
    assert out.shape[1] == 1024, f"unexpected feature dim {out.shape}"
    return out


def compute_metrics(y, s, thr=0.0):
    """y: 1 = fake, 0 = real. s: SVM decision score (>thr -> fake)."""
    y, s = np.asarray(y), np.asarray(s)
    pred = (s > thr).astype(int)
    real, fake = y == 0, y == 1
    tnr = float((pred[real] == 0).mean())
    tpr = float((pred[fake] == 1).mean())
    return dict(n_real=int(real.sum()), n_fake=int(fake.sum()),
                real_acc=tnr, fake_acc=tpr, bal_acc=(tnr + tpr) / 2,
                fpr=1 - tnr, fnr=1 - tpr,
                auc=float(roc_auc_score(y, s)) if real.any() and fake.any() else float("nan"))


def group_of(filename, is_fake):
    """Group by generator using the sb_<generator>_<id> filename prefix."""
    stem = filename.rsplit(".", 1)[0]
    if not is_fake:
        return "real_coco" if stem.startswith("coco_") else "real_other"
    if stem.startswith("sb_"):
        rest = stem[3:]
        return re.sub(r"_\d+$", "", rest)   # adjust if your names differ
    if stem.startswith("own_"):
        return "own"
    return "other_fake" 