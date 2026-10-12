export function disintegrateComment(card: HTMLElement, signal: AbortSignal): Promise<void> {
  if (signal.aborted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  return new Promise((resolve) => {
    const originalStyle = card.getAttribute("style");
    const canvas = document.createElement("canvas");
    const image = new Image();
    const avatars: { image: HTMLImageElement; x: number; y: number; width: number; height: number; radius: number }[] = [];
    let frame = 0;
    let animation: Animation | undefined;
    let replySpacing: Animation | undefined;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      avatars.forEach((avatar) => { avatar.image.src = ""; });
      animation?.cancel();
      replySpacing?.cancel();
      canvas.remove();
      image.src = "";
      if (originalStyle === null) card.removeAttribute("style");
      else card.setAttribute("style", originalStyle);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, 1800);
    signal.addEventListener("abort", finish, { once: true });
    void (async () => {
      const bounds = card.getBoundingClientRect();
      const width = Math.ceil(bounds.width), height = Math.ceil(bounds.height);
      if (!width || !height || width * height > 2_000_000 || bounds.bottom < 0 || bounds.top > innerHeight) return finish();
      const clone = card.cloneNode(true) as HTMLElement;
      const originals = [card, ...card.querySelectorAll<HTMLElement>("*")];
      const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
      const properties = ["display", "position", "box-sizing", "width", "height", "min-width", "max-width", "min-height", "max-height", "padding", "margin", "border", "border-radius", "background", "background-size", "background-position", "color", "font", "letter-spacing", "line-height", "text-align", "text-decoration", "text-transform", "white-space", "overflow-wrap", "word-break", "vertical-align", "align-items", "justify-content", "place-items", "gap", "grid-template-columns", "flex", "flex-wrap", "flex-direction", "opacity", "overflow", "fill", "stroke", "stroke-width"];
      await Promise.all(originals.map(async (element, index) => {
        const style = getComputedStyle(element);
        const copy = copies[index];
        if (!copy) throw new Error("snapshot_changed");
        copy.removeAttribute("id");
        for (const property of properties) copy.style.setProperty(property, style.getPropertyValue(property));
        const url = /^url\(["']?(.*?)["']?\)$/.exec(style.backgroundImage)?.[1];
        if (url) {
          copy.style.backgroundImage = "none";
          const rect = element.getBoundingClientRect();
          const photo = new Image();
          avatars.push({ image: photo, x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height, radius: parseFloat(style.borderRadius) || 0 });
          photo.src = url;
          await photo.decode().catch(() => {});
        }
      }));
      if (finished) return;
      clone.style.margin = "0";
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;
      clone.querySelectorAll(".v-ripple").forEach((ripple) => ripple.remove());
      const markup = new XMLSerializer().serializeToString(clone);
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`)}`;
      await image.decode();
      if (finished) return;
      const snapshot = document.createElement("canvas");
      snapshot.width = width;
      snapshot.height = height;
      const source = snapshot.getContext("2d", { willReadFrequently: true });
      const context = canvas.getContext("2d");
      if (!source || !context) return finish();
      source.drawImage(image, 0, 0);
      const pixels = source.getImageData(0, 0, width, height).data;
      for (const avatar of avatars) {
        if (!avatar.image.naturalWidth || !avatar.image.naturalHeight) continue;
        const scale = Math.max(avatar.width / avatar.image.naturalWidth, avatar.height / avatar.image.naturalHeight);
        source.save();
        source.beginPath();
        source.roundRect(avatar.x, avatar.y, avatar.width, avatar.height, avatar.radius);
        source.clip();
        source.drawImage(avatar.image, avatar.x + (avatar.width - avatar.image.naturalWidth * scale) / 2, avatar.y + (avatar.height - avatar.image.naturalHeight * scale) / 2, avatar.image.naturalWidth * scale, avatar.image.naturalHeight * scale);
        source.restore();
      }
      const step = Math.max(2, Math.ceil(Math.sqrt(width * height / 12000)));
      const particles: { x: number; y: number; delay: number; vx: number; vy: number; life: number }[] = [];
      const noise = (x: number, y: number) => {
        const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return value - Math.floor(value);
      };
      for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
        const offset = (y * width + x) * 4;
        if (!pixels[offset + 3]) continue;
        const random = noise(x, y);
        particles.push({ x, y, delay: x / width * 300 + random * 70, vx: (random - .35) * 100, vy: -20 - noise(y, x) * 70, life: 380 + random * 220 });
      }
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(innerWidth * ratio);
      canvas.height = Math.ceil(innerHeight * ratio);
      canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10;contain:strict";
      canvas.setAttribute("aria-hidden", "true");
      canvas.dataset.commentDust = "true";
      context.scale(ratio, ratio);
      document.body.append(canvas);
      card.style.visibility = "hidden";
      const start = performance.now();
      const draw = (now: number) => {
        try {
          if (finished) return;
          if (!card.isConnected || document.hidden) return finish();
          const elapsed = now - start;
          const rect = card.getBoundingClientRect();
          context.clearRect(0, 0, innerWidth, innerHeight);
          for (const particle of particles) {
            const age = Math.max(0, elapsed - particle.delay);
            if (age > particle.life) continue;
            const t = age / 1000;
            const progress = age / particle.life;
            context.globalAlpha = Math.min(1, (1 - progress) / .65);
            context.drawImage(snapshot, particle.x, particle.y, step, step, rect.left + particle.x + particle.vx * t, rect.top + particle.y + particle.vy * t - 35 * t * t, step * (1 - progress * .5), step * (1 - progress * .5));
          }
          if (elapsed < 970) frame = requestAnimationFrame(draw);
          else {
            canvas.remove();
            const parent = card.parentElement!;
            const gap = parseFloat(getComputedStyle(parent).rowGap) || 0;
            if (parent.matches(".comment-replies") && parent.children.length === 1) {
              replySpacing = parent.animate([{ marginTop: getComputedStyle(parent).marginTop }, { marginTop: "0px" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
            }
            animation = card.animate([
              { height: `${rect.height}px`, paddingTop: getComputedStyle(card).paddingTop, paddingBottom: getComputedStyle(card).paddingBottom, borderWidth: "1px", marginBottom: "0px" },
              { height: "0px", paddingTop: "0px", paddingBottom: "0px", borderWidth: "0px", marginBottom: `${card.parentElement!.children.length > 1 ? -gap : 0}px` }
            ], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
            card.style.minHeight = "0";
            card.style.overflow = "hidden";
            animation.finished.then(finish, finish);
          }
        } catch { finish(); }
      };
      frame = requestAnimationFrame(draw);
    })().catch(finish);
  });
}
