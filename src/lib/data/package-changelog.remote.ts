import { getInternalPackage } from './package.server';
import { getRequestEvent, query } from '$app/server';
import { USER_AGENT, cached } from './common.server';
import { GITHUB_TOKEN } from '$env/static/private';
import type { PackageChangelog } from './types';
import { join as joinPaths } from '@std/path';
import hostedGitInfo from 'hosted-git-info';
import { vSpecifier } from '$lib/valibot';
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

// todo check mime?
export const getPackageChangelog = query(
	vSpecifier,
	async (specifier): Promise<PackageChangelog | null> => {
		const event = getRequestEvent();
		const pkg = await getInternalPackage(specifier, event.platform!);

		return await cached({
			key: `package-changelog:${pkg.name}-${pkg.version}`,
			platform: event.platform!,
			ttl: 600,
			async value() {
				const npmChangelog = await ofetch(
					`https://unpkg.com/${pkg.name}@${pkg.version}/CHANGELOG.md`,
					{
						headers: { 'User-Agent': USER_AGENT },
						responseType: 'text',
					},
				).catch(() => null);

				if (npmChangelog) {
					return { source: 'npm', content: npmChangelog };
				}

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
				} while (results.length % 100 === 0);

				return {
					source: 'gh-releases',
					content: results
						.sort((a, b) => b.publishedAt - a.publishedAt)
						.map((r) => r.md)
						.join('\n\n'),
				};
			},
		});
	},
);
