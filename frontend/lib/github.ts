const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

export interface GitHubRepoContext {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  readme: string;
  defaultBranch: string;
}

/**
 * Parse a GitHub URL or repo slug into owner/repo
 * Handles: "owner/repo", "https://github.com/owner/repo", "github.com/owner/repo"
 */
export function parseGitHubInput(input: string): { owner: string; repo: string } {
  const trimmed = input.trim();

  // Handle full URLs
  const urlMatch = trimmed.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  // Handle owner/repo format
  const parts = trimmed.split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error("Invalid GitHub repository format. Use 'owner/repo' or a GitHub URL.");
}

/**
 * Fetch repository metadata and README from GitHub API
 */
export async function fetchGitHubRepoContext(input: string): Promise<GitHubRepoContext> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const { owner, repo } = parseGitHubInput(input);

  // Fetch repo metadata
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!repoResponse.ok) {
    const errBody = await repoResponse.text().catch(() => "");
    throw new Error(`GitHub API error ${repoResponse.status}: ${errBody}`);
  }

  const repoData = await repoResponse.json();

  // Fetch README
  let readme = "";
  try {
    const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json();
      // GitHub returns README content as base64
      if (readmeData.content) {
        readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
      }
    }
  } catch {
    // README fetch is optional - continue without it
    console.warn("Could not fetch README for", `${owner}/${repo}`);
  }

  return {
    name: repoData.name ?? repo,
    description: repoData.description ?? "",
    language: repoData.language ?? null,
    stars: repoData.stargazers_count ?? 0,
    forks: repoData.forks_count ?? 0,
    openIssues: repoData.open_issues_count ?? 0,
    topics: repoData.topics ?? [],
    readme,
    defaultBranch: repoData.default_branch ?? "main",
  };
}

/**
 * Format GitHub context into a prompt-friendly string
 */
export function formatGitHubContext(context: GitHubRepoContext): string {
  const sections: string[] = [];

  sections.push(`Repository: ${context.name}`);
  if (context.description) sections.push(`Description: ${context.description}`);
  if (context.language) sections.push(`Primary Language: ${context.language}`);
  sections.push(`Stars: ${context.stars}`);
  sections.push(`Forks: ${context.forks}`);
  sections.push(`Open Issues: ${context.openIssues}`);
  if (context.topics.length > 0) sections.push(`Topics: ${context.topics.join(", ")}`);

  if (context.readme) {
    sections.push("\n--- README.md ---\n");
    // Truncate README to avoid token limits (keep first 8000 chars)
    sections.push(context.readme.slice(0, 8000));
  }

  return sections.join("\n");
}
