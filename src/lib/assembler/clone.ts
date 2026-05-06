import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

const TEMPLATE_REPO: Record<string, string> = {
  marketplace: "template-marketplace",
  saas: "template-saas",
  directory: "template-directory",
  community: "template-community",
  ecommerce: "template-ecommerce",
  "client-portal": "template-client-portal",
  "internal-tool": "template-internal-tool",
  "content-media": "template-content-media",
};

export async function cloneTemplate(template: string, workdir: string): Promise<void> {
  const repoName = TEMPLATE_REPO[template];
  if (!repoName) throw new Error(`Unknown template type: ${template}`);

  const base = process.env.GITEA_BASE_URL!;
  const org = process.env.GITEA_TEMPLATES_ORG!;
  const token = process.env.GITEA_API_TOKEN!;

  const urlObj = new URL(base);
  const cloneUrl = `${urlObj.protocol}//${token}@${urlObj.host}/${org}/${repoName}.git`;

  await fs.mkdir(workdir, { recursive: true });
  await execAsync(`git clone --depth 1 "${cloneUrl}" "${workdir}"`);

  await fs.rm(`${workdir}/.git`, { recursive: true, force: true });
}
