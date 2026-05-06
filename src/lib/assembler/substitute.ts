import fs from "fs/promises";
import { glob } from "glob";
import type { SlotMap } from "@/types/denovo";

export async function substituteTokens(workdir: string, slots: SlotMap): Promise<number> {
  if (!workdir || workdir.includes("..") || workdir.includes("\0")) {
    throw new Error("Invalid workdir path");
  }

  // absolute: true returns fully-resolved paths — no path.join(workdir, file) needed
  const files = await glob("**/*.{ts,tsx,css,json,md,sql,yaml,yml,txt}", {
    cwd: workdir,
    absolute: true,
    ignore: ["node_modules/**", ".next/**"],
  });

  for (const filepath of files) {
    let content = await fs.readFile(filepath, "utf8");
    let changed = false;

    for (const [key, value] of Object.entries(slots)) {
      if (value === undefined || value === null) continue;
      const token = `{{${key}}}`;
      if (!content.includes(token)) continue;

      const replacement = Array.isArray(value) ? JSON.stringify(value) : String(value);
      content = content.replaceAll(token, replacement);
      changed = true;
    }

    if (changed) await fs.writeFile(filepath, content);
  }

  return files.length;
}
