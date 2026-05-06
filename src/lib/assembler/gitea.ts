export const giteaClient = {
  async createRepo(opts: {
    org: string;
    name: string;
    description: string;
    private: boolean;
  }) {
    const base = process.env.GITEA_BASE_URL!;
    const token = process.env.GITEA_API_TOKEN!;

    const res = await fetch(`${base}/api/v1/orgs/${opts.org}/repos`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: opts.name,
        description: opts.description,
        private: opts.private,
        auto_init: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Gitea createRepo failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return {
      id: data.id as number,
      name: data.name as string,
      cloneUrl: data.clone_url as string,
      htmlUrl: data.html_url as string,
    };
  },
};
