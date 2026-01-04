import { packageName, vSpecifier, type Specifier } from '$lib/valibot';
import { cached, registry, USER_AGENT } from './common.server';
import type { Packument, PackumentVersion, Repository } from '@npm/types';
import { serendipity } from '$lib/assets/serendipity-shiki';
import { getRequestEvent, query } from '$app/server';
import { join as joinPaths } from '@std/path';
import createDOMPurify from 'dompurify';
import markedShiki from 'marked-shiki';
import { error } from '@sveltejs/kit';
import { codeToHtml } from 'shiki';
import { ofetch } from 'ofetch';
import { Marked } from 'marked';
import { JSDOM } from 'jsdom';
import semver from 'semver';
import {
	all,
	type DocumentedModuleReplacement,
	type ModuleReplacement,
} from 'module-replacements';

const PACKUMENT_VERSION_FIELDS = [
	'_hasShrinkwrap',
	'_id',
	'_nodeVersion',
	'_npmUser',
	'_npmVersion',
	'browser',
	'deprecated',
	'gitHead',
	'readmeFilename',
] as const;

type OmitWithIndex<T, K extends keyof T> = {
	[P in keyof T as P extends K ? never : P]: T[P];
};

type ApproxPackageJSON = OmitWithIndex<
	PackumentVersion,
	(typeof PACKUMENT_VERSION_FIELDS)[number]
> & {
	exports?: string | Record<string, string | Record<string, string>>;
};

function getApproxPackageJSON(pac: Packument, version: string) {
	return Object.fromEntries(
		Object.entries(pac['versions'][version]).filter(
			([key]) =>
				!PACKUMENT_VERSION_FIELDS.includes(key as any) &&
				!key.startsWith('_'),
		),
	) as ApproxPackageJSON;
}

export interface PackageLinks {
	repository?: string;
	homepage?: string;
	npm: string;
}

export interface Package {
	name: string;
	version: string;
	links: PackageLinks;
	moduleReplacements: ModuleReplacement[];
	types: PackageTypeStatus;
}

export const getPackage = query(vSpecifier, async (specifier) => {
	const event = getRequestEvent();
	const { name, version } = await resolveSpecifier(
		specifier,
		event.platform!,
	);

	return await cached(
		`package:${name}-${version}`,
		event.platform!,
		600,
		async (): Promise<Package> => {
			const pkg = await registry<Packument>(`/${name}`);
			const packageJSON = getApproxPackageJSON(pkg, version);

			const moduleReplacements = all.moduleReplacements.filter(
				(m) => m.type !== 'none' && m.moduleName === name,
			);

			const types = await packageTypeStatus(packageJSON, event.platform!);

			return {
				name: pkg.name,
				version,
				links: {
					repository: pkg.repository?.url,
					homepage: pkg.homepage,
					npm: `https://www.npmjs.com/package/${pkg.name}`,
				},
				moduleReplacements,
				types,
			};
		},
	);
});

export interface PackageVersion {
	version: string;
	group: string;
	groupState: 'deprecated' | 'lead' | null;
	license?: string;
	unpackedSize?: number;
	publishedAt: Date | null;
}

export const getPackageVersions = query(vSpecifier, async ({ name }) => {
	const event = getRequestEvent();

	return await cached(
		`package-versions:${name}`,
		event.platform!,
		60,
		async () => {
			const pkg = await registry<Packument>(`/${name}`);

			const versions = Object.values(pkg.versions)
				.map((pkv): PackageVersion & { _v: semver.SemVer } => {
					const date = new Date(pkg.time[pkv.version]);
					const versionParsed = semver.parse(pkv.version)!;

					return {
						version: pkv.version,
						_v: versionParsed,
						group: versionParsed.major
							? `${versionParsed.major}.x`
							: `0.${versionParsed.minor}`,
						groupState: pkv.deprecated ? 'deprecated' : null, // lead set later
						license: pkv.license,
						unpackedSize: pkv.dist.unpackedSize,
						publishedAt: Number.isNaN(date.getTime()) ? null : date,
					};
				})
				.sort((a, b) => semver.compare(b._v, a._v));

			const highestInGroups = new Map<string, string>();

			for (const pkv of versions) {
				// @ts-expect-error needs removing here
				delete pkv._v;

				if (
					pkv.groupState !== 'deprecated' &&
					!highestInGroups.has(pkv.group)
				) {
					highestInGroups.set(pkv.group, pkv.version);
					pkv.groupState = 'lead';
				}
			}

			return versions as PackageVersion[];
		},
	);
});

export interface PackageTypeStatus {
	status: 'built-in' | 'definitely-typed' | 'none';
	definitelyTypedPkg: string;
}

async function packageTypeStatus(
	pkg: ApproxPackageJSON,
	platform: App.Platform,
): Promise<PackageTypeStatus> {
	const definitelyTypedPkg = pkg.name.startsWith('@')
		? pkg.name.replace('/', '__').replace('@', '@types/')
		: pkg.name;

	if (pkg.types) {
		return { status: 'built-in', definitelyTypedPkg };
	}

	const builtIn =
		// "exports": "./foo.ts"
		(typeof pkg.exports === 'string' && pkg.exports.endsWith('ts')) ||
		// "exports": { ".": "./foo.ts" }
		(typeof pkg.exports !== 'string' &&
			typeof pkg.exports?.['.'] === 'string' &&
			pkg.exports?.['.'].endsWith('ts')) ||
		// "exports": { ".": { types: "./foo.ts" } }
		(typeof pkg.exports !== 'string' &&
			typeof pkg.exports?.['.'] !== 'string' &&
			pkg.exports?.['.']?.types.endsWith('ts'));

	if (builtIn) {
		return { status: 'built-in', definitelyTypedPkg };
	}

	const dtExists = await cached(
		`dt-exists:${pkg.name}`,
		platform,
		600,
		async () => {
			try {
				await registry<PackumentVersion>(
					`/${definitelyTypedPkg}/latest`,
				);

				return true;
			} catch (error) {
				return false;
			}
		},
	);

	return {
		status: dtExists ? 'definitely-typed' : 'none',
		definitelyTypedPkg,
	};
}

async function renderMarkdown(markdown: string, linkBase?: string) {
	const marked = new Marked(
		markedShiki({
			async highlight(code, lang) {
				return await codeToHtml(code, { lang, theme: serendipity });
			},
		}),
	);

	// todo rewrite to use lol-html
	if (linkBase) {
		marked.use({
			walkTokens(token) {
				if (token.type === 'link' || token.type === 'image') {
					if (!URL.canParse(token.href)) {
						token.href = joinPaths(linkBase, token.href);
					}
				}
			},
		});
	}

	const md = await marked.parse(markdown, { gfm: true });

	const window = new JSDOM('').window;
	const dompurify = createDOMPurify(window);

	return dompurify.sanitize(md);
}

function getLinkBase(repo?: Repository) {
	if (!repo || !repo.url) return null;

	const url = URL.parse(
		repo.url.startsWith('git+') ? repo.url.slice(4) : repo.url,
	);

	if (
		!url ||
		!['http:', 'https:'].includes(url.protocol) ||
		url?.hostname !== 'github.com'
	) {
		return null;
	}

	const [, user, repoName] = url.pathname.split('/');

	url.hostname = 'raw.githubusercontent.com';
	url.protocol = 'https:';
	// todo needs better sanitising
	url.pathname = `/${joinPaths(user, repoName.replace(/\.git$/, ''), 'HEAD', repo.directory || '')}`;

	return url.toString();
}

export const renderREADME = query(vSpecifier, async (specifier) => {
	const event = getRequestEvent();
	const { name, version } = await resolveSpecifier(
		specifier,
		event.platform!,
	);

	return await cached(
		`readme:${name}-${version}`,
		event.platform!,
		600,
		async () => {
			const pkg = await registry<Packument>(`/${name}`);
			const linkBase = getLinkBase(pkg.repository);

			const readme = await ofetch(
				`https://unpkg.com/${name}@${version}/README.md`,
				{
					responseType: 'text',
					headers: { 'User-Agent': USER_AGENT },
				},
			).catch(() => null);

			if (!readme) {
				return null;
			}

			return await renderMarkdown(readme, linkBase || undefined);
		},
	);
});

export const renderDocumentedModuleReplacement = query(
	packageName,
	async (name) => {
		const event = getRequestEvent();

		return await cached(
			`module-replacement-render:${name}`,
			event.platform!,
			600,
			async () => {
				const replacement = all.moduleReplacements.find(
					(r) => r.type === 'documented' && r.moduleName == name,
				) as DocumentedModuleReplacement | undefined;

				if (!replacement) {
					error(404, 'failed to find requested replacement');
				}

				const doc = await ofetch(
					`https://raw.githubusercontent.com/es-tooling/module-replacements/refs/heads/main/docs/modules/${replacement.docPath}.md`,
					{
						responseType: 'text',
						headers: { 'User-Agent': USER_AGENT },
					},
				).catch(() => null);

				if (!doc) {
					error(404, 'failed to find requested documentation');
				}

				return await renderMarkdown(
					doc.replace(/^---\n.*\n---/, '').trim(),
				);
			},
		);
	},
);

async function resolveSpecifier(specifier: Specifier, platform: App.Platform) {
	if (specifier.type === 'version') {
		return { name: specifier.name, version: specifier.fetchSpec };
	}

	return await cached(
		`parsed-specifier:${specifier}`,
		platform,
		60,
		async () => {
			const pkg = await registry<Packument>(`/${specifier.name}`);
			let version: string | null = null;

			if (specifier.type === 'tag') {
				version = pkg['dist-tags'][specifier.fetchSpec] || null;
			} else if (
				specifier.type === 'range' &&
				['*', 'latest'].includes(specifier.fetchSpec)
			) {
				version = pkg['dist-tags'].latest || null;
			} else if (specifier.type === 'range') {
				let maxVersion = pkg['dist-tags'].latest || null;
				if (!semver.satisfies(maxVersion!, specifier.fetchSpec))
					maxVersion = null;

				for (const ver of Object.keys(pkg.versions)) {
					if (semver.satisfies(ver, specifier.fetchSpec)) {
						if (!maxVersion || semver.lte(ver, maxVersion))
							version = ver;
					}
				}
			}

			return { name: specifier.name, version: version! };
		},
	);
}
