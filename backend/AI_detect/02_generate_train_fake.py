"""Generate one Stable Diffusion image per real image, using its caption as prompt.
Resumable: existing files are skipped. This is the slow step (can take an hour
or more for 200 images on a MacBook Air). Start with a smaller N_TRAIN if needed."""
import json
import torch
from diffusers import StableDiffusionPipeline

import config
from common import get_device

device = get_device()
dtype = torch.float32 if device in ("mps", "cuda") else torch.float32

pipe = StableDiffusionPipeline.from_pretrained(
    config.SD_MODEL, torch_dtype=dtype, safety_checker=None)
pipe = pipe.to(device)
pipe.enable_attention_slicing()
# If images come out black on MPS, change dtype above to torch.float32.

caps = json.loads(config.CAPTIONS.read_text())
for k, (real_name, prompt) in enumerate(sorted(caps.items()), 1):
    stem = real_name.rsplit(".", 1)[0]
    dest = config.TRAIN_FAKE / f"fake_{stem}.png"
    if dest.exists():
        continue
    gen = torch.Generator("cpu").manual_seed(config.SEED + k)
    img = pipe(prompt, num_inference_steps=config.SD_STEPS,
               generator=gen).images[0]
    img.save(dest)
    print(f"[{k}/{len(caps)}] {dest.name}  <-  {prompt[:60]}")

print("Done.")