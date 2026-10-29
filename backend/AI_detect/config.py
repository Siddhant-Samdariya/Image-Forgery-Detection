from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
TRAIN_REAL = DATA / "train" / "real"
TRAIN_FAKE = DATA / "train" / "fake"
CAPTIONS = DATA / "train" / "captions.json"
TEST_ROOT = DATA / "test_images"
MODELS = ROOT / "models"
CACHE = ROOT / "cache"
RESULTS = ROOT / "results"

for d in (TRAIN_REAL, TRAIN_FAKE, MODELS, CACHE, RESULTS):
    d.mkdir(parents=True, exist_ok=True)

# CLIP backbone. The paper's best results use the largest pre-training set
# (CommonPool / DataComp, 12.8B samples).
CLIP_ARCH = "ViT-L-14"
CLIP_PRETRAINED = "datacomp_xl_s13b_b90k"   # alternative: "laion2b_s32b_b82k"

N_TRAIN = 200        # real/fake PAIRS. Paper: 1k-10k best, ~100 still works.
SEED = 0

# Fake generator for training (a latent diffusion model, like the paper's "Latent")
SD_MODEL = "stable-diffusion-v1-5/stable-diffusion-v1-5"
SD_STEPS = 25

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}