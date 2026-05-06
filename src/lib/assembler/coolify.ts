export const coolifyClient = {
  async createApplication(opts: {
    name: string;
    gitRepository: string;
    gitBranch: string;
    port: number;
    domain: string;
    environmentVariables: Record<string, string>;
  }) {
    const base = process.env.COOLIFY_BASE_URL!;
    const token = process.env.COOLIFY_API_TOKEN!;

    const res = await fetch(`${base}/api/v1/applications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: opts.name,
        git_repository: opts.gitRepository,
        git_branch: opts.gitBranch,
        build_pack: "nixpacks",
        ports_exposes: String(opts.port),
        fqdn: opts.domain,
        environment_variables: Object.entries(opts.environmentVariables).map(
          ([key, value]) => ({ key, value })
        ),
      }),
    });

    if (!res.ok) {
      throw new Error(`Coolify createApplication failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return { id: data.uuid as string };
  },

  async deploy(appId: string) {
    const base = process.env.COOLIFY_BASE_URL!;
    const token = process.env.COOLIFY_API_TOKEN!;

    const res = await fetch(`${base}/api/v1/applications/${appId}/deploy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Coolify deploy failed: ${res.status} ${await res.text()}`);
    }
  },
};
