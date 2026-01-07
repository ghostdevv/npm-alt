import { getInternalPackage } from './package.server';
import { USER_AGENT, cached } from './common.server';
import { GITHUB_TOKEN } from '$env/static/private';
import type { PackageChangelog } from './types';
import { join as joinPaths } from '@std/path';
import hostedGitInfo from 'hosted-git-info';
import { ofetch } from 'ofetch';

interface RawGithubRelease {
	name: string;
	body: string;
	draft: boolean;
	prerelease: boolean;
	published_at: string;
}

interface Release {
	md: string;
	publishedAt: number;
}

export async function getChangelog(
	name: string,
	version: string,
	platform: App.Platform,
): Promise<PackageChangelog | null> {
	return await cached({
		key: `changelog:${name}@${version}`,
		platform,
		ttl: 600,
		async value() {
			const npmChangelog = await ofetch(
				`https://unpkg.com/${name}@${version}/CHANGELOG.md`,
				{
					headers: { 'User-Agent': USER_AGENT },
					responseType: 'text',
				},
			).catch(() => null);

			if (npmChangelog) {
				return { source: 'npm', content: npmChangelog };
			}

			const pkg = await getInternalPackage({ name, version }, platform);

			const repo = pkg.repoURL
				? hostedGitInfo.fromUrl(pkg.repoURL)
				: undefined;

			if (!repo) {
				return null;
			}

			const gitChangelogFilePath = repo.file(
				joinPaths('/', pkg.repoDir || '', 'CHANGELOG.md'),
			);

			const gitChangelog = await ofetch(gitChangelogFilePath, {
				headers: { 'User-Agent': USER_AGENT },
				responseType: 'text',
			}).catch(() => null);

			if (gitChangelog) {
				return { source: 'git', content: gitChangelog };
			}

			if (repo.domain !== 'github.com') {
				return null;
			}

			const results: Release[] = [];

			do {
				const res = await ofetch<RawGithubRelease[]>(
					`/repos/${repo.user}/${repo.project}/releases`,
					{
						baseURL: 'https://api.github.com',
						// baseURL: 'https://ungh.cc',
						retryDelay: 300,
						retry: 3,
						headers: {
							Accept: 'application/vnd.github+json',
							'X-GitHub-Api-Version': '2022-11-28',
							'User-Agent': USER_AGENT,
							Authorization: `Bearer ${GITHUB_TOKEN}`,
						},
						query: {
							per_page: 100,
							page: 1,
						},
					},
				);

				results.push(
					...res
						.filter((r) => !r.draft && !r.prerelease)
						.map((r) => ({
							md: `# ${r.name}\n\n${r.body}`,
							publishedAt: Date.parse(r.published_at),
						})),
				);
			} while (results.length !== 0 && results.length % 100 === 0);

			if (results.length === 0) {
				return null;
			}

			return {
				source: 'gh-releases',
				content: results
					.sort((a, b) => b.publishedAt - a.publishedAt)
					.map((r) => r.md)
					.join('\n\n'),
			};
		},
	});
}
