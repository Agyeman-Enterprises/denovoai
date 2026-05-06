import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import { glob } from "glob";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function generateSchemaExtras(workdir: string, extras: string[]): Promise<void> {
  if (extras.length === 0) return;
  if (!workdir || workdir.includes("..") || workdir.includes("\0")) {
    throw new Error("Invalid workdir path");
  }

  // absolute: true — no path.join(workdir, migration) needed
  const migrations = await glob("supabase/migrations/*.sql", {
    cwd: workdir,
    absolute: true,
  });

  if (migrations.length === 0) return;

  const migrationPath = migrations[0];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Convert these field names to PostgreSQL ALTER TABLE ADD COLUMN statements for the listings table.
Return ONLY the SQL, nothing else. No explanation, no markdown, no backticks.

Fields: ${extras.join(", ")}

Rules:
- Arrays become text[]
- Fields ending in _url become text
- Fields ending in _cents become int
- Fields ending in _count, _minutes, _days become int
- Boolean fields become boolean default false
- Everything else becomes text
- Format: ADD COLUMN IF NOT EXISTS {name} {type}
- Comma-separate each line
- No trailing semicolon`,
    }],
  });

  const sql =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  if (sql) {
    await fs.appendFile(
      migrationPath,
      `\n-- Auto-generated schema extras\nALTER TABLE listings\n  ${sql};\n`
    );
  }
}
