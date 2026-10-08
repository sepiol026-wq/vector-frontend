const tags = ["b", "i", "u", "s", "code", "pre", "br"];

export function sanitizeHtml(input: string): string {
  let out = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  for (const tag of tags) {
    out = out.replace(new RegExp(`&lt;${tag}&gt;`, "gi"), `<${tag}>`);
    out = out.replace(new RegExp(`&lt;/${tag}&gt;`, "gi"), `</${tag}>`);
    if (tag === "br") {
      out = out.replace(new RegExp(`&lt;${tag}\\s*/?&gt;`, "gi"), `<${tag}/>`);
    }
  }

  const stack: string[] = [];
  const tagRe = /<(\/?)(\w+)[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(out)) !== null) {
    const [, closing, name] = m;
    if (!name) continue;
    const lower = name.toLowerCase();
    if (closing) {
      const idx = stack.lastIndexOf(lower);
      if (idx >= 0) stack.splice(idx, 1);
    } else if (tags.includes(lower)) {
      stack.push(lower);
    }
  }
  for (const tag of stack.reverse()) {
    out += `</${tag}>`;
  }

  return out;
}
