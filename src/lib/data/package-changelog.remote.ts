import { getRequestEvent, query } from '$app/server';
import { GITHUB_TOKEN } from '$env/static/private';
import { join as joinPaths } from '@std/path';
import hostedGitInfo from 'hosted-git-info';
import type { Packument } from '@npm/types';
import { vSpecifier } from '$lib/valibot';
import { ofetch } from 'ofetch';
import {
	resolveSpecifier,
	USER_AGENT,
	registry,
	cached,
} from './common.server';

interface PackageChangelog {
	source: 'npm' | 'git' | 'gh-releases';
	content: string;
}

interface RawGithubRelease {
	name: string;
	body: string;
	draft: boolean;
	prerelease: boolean;
	published_at: string;
}

interface GithubRelease {
	md: string;
	publishedAt: number;
}

// todo check mime?
export const getPackageChangelog = query(
	vSpecifier,
	async (specifier): Promise<PackageChangelog | null> => {
		const event = getRequestEvent();
		const { name, version } = await resolveSpecifier(
			specifier,
			event.platform!,
		);

		return await cached(
			`package-changelog:${name}-${version}`,
			event.platform!,
			600,
			async () => {
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

				const pkg = await registry<Packument>(`/${name}`);

				const repo = pkg.repository?.url
					? hostedGitInfo.fromUrl(pkg.repository.url)
					: undefined;

				if (!repo) {
					return null;
				}

				const gitChangelogFilePath = repo.file(
					joinPaths(
						'/',
						pkg.repository?.directory || '',
						'CHANGELOG.md',
					),
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

				const results: GithubRelease[] = [];

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
		);
	},
);
