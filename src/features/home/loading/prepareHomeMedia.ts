function cancelled(signal: AbortSignal) {
  signal.throwIfAborted();
}

function imageFailure(image: HTMLImageElement, stage: string, error?: unknown) {
  const source = image.currentSrc || image.src || "sin URL";
  const detail = error instanceof Error ? error.name + ": " + error.message : String(error ?? "imagen no disponible");
  return new Error("[" + stage + "] " + source + " — " + detail);
}

export async function decodeHomeImage(image: HTMLImageElement, signal: AbortSignal) {
  cancelled(signal);
  // Preserve <picture>, sizes and srcset: the browser selects the device candidate.
  image.loading = "eager";
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
        signal.removeEventListener("abort", aborted);
      };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(imageFailure(image, "load")); };
      const aborted = () => { cleanup(); reject(signal.reason); };
      image.addEventListener("load", loaded, { once: true });
      image.addEventListener("error", failed, { once: true });
      signal.addEventListener("abort", aborted, { once: true });
      if (image.complete) loaded();
    });
  }
  cancelled(signal);
  if (!image.naturalWidth) throw imageFailure(image, "naturalWidth");
  try {
    await image.decode();
  } catch (error: unknown) {
    cancelled(signal);
    throw imageFailure(image, "decode", error);
  }
  cancelled(signal);
}

function selectedCssImages(root: HTMLElement) {
  const sources = new Set<string>();
  const nodes = [root, ...root.querySelectorAll<HTMLElement>("*")];
  for (const node of nodes) {
    for (const pseudo of [null, "::before", "::after"]) {
      const style = getComputedStyle(node, pseudo);
      for (const value of [style.backgroundImage, style.maskImage, style.webkitMaskImage]) {
        for (const match of value.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          if (!match[1].startsWith("#")) sources.add(match[1]);
        }
      }
    }
  }
  return sources;
}

export async function prepareHomeMedia(root: HTMLElement, signal: AbortSignal) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const decorations = Array.from(selectedCssImages(root), (src) => {
    const image = new Image();
    image.src = src;
    return image;
  });
  await Promise.all([...images, ...decorations].map((image) => decodeHomeImage(image, signal)));
}

export function nextHomeFrame(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    cancelled(signal);
    const id = requestAnimationFrame(() => {
      signal.removeEventListener("abort", aborted);
      resolve();
    });
    const aborted = () => { cancelAnimationFrame(id); reject(signal.reason); };
    signal.addEventListener("abort", aborted, { once: true });
  });
}
