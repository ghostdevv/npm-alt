import { allModuleReplacements } from './module-replacements.server';
import type { Packument, PackumentVersion } from '@npm/types';
import { vSpecifier, type Specifier } from '$lib/valibot';
import { getRequestEvent, query } from '$app/server';
import { cached, registry } from './common.server';
import { join as joinPaths } from '@std/path';
import hostedGitInfo from 'hosted-git-info';
import { ofetch } from 'ofetch';
import semver from 'semver';
import mimes from 'mime-db';

function getModuleReplacements(moduleName: string) {
	return allModuleReplacements
		.filter((m) => m.type !== 'none' && m.moduleName === moduleName)
		.map((m) => {
			if (m.type === 'documented') {
				return {
					...m,
					docLink: `https://raw.githubusercontent.com/es-tooling/module-replacements/refs/heads/main/docs/modules/${m.docPath}.md`,
				};
			}

			return m;
		});
}

// todo yeet
export interface PackageLinks {
	repository?: string;
	homepage?: string;
	npm: string;
}

export interface Package {
	name: string;
	version: string;
	repo?: {
		link: string;
		dir?: string;
		assets: string;
	};
	homepage?: string;
	npm: string;
	moduleReplacements: ReturnType<typeof getModuleReplacements>;
	types: PackageTypeStatus;
	deprecated?: string;
	license?: string;
	unpackedSize?: number;
	publishedAt: Date;
	createdAt: Date;
	updatedAt: Date;
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
			const packageJSON = pkg['versions'][version];

			const repo = pkg.repository?.url
				? hostedGitInfo.fromUrl(pkg.repository.url)
				: undefined;

			return {
				name: pkg.name,
				version,
				repo: repo
					? {
							link: repo.https({ noGitPlus: true }),
							dir: pkg.repository?.directory,
							assets: repo.file('/'),
						}
					: undefined,
				homepage: pkg.homepage,
				npm: `https://www.npmjs.com/package/${pkg.name}`,
				moduleReplacements: getModuleReplacements(name),
				types: await packageTypeStatus(packageJSON, event.platform!),
				deprecated: packageJSON.deprecated,
				license: packageJSON.license,
				unpackedSize: packageJSON.dist.unpackedSize,
				publishedAt: new Date(pkg.time[version]),
				createdAt: new Date(pkg.time.created),
				updatedAt: new Date(pkg.time.modified),
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

interface ExportsPackumentVersion extends PackumentVersion {
	exports?: string | Record<string, string | Record<string, string>>;
}

async function packageTypeStatus(
	pkg: ExportsPackumentVersion,
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

			// Based on MIT Licensed code from Anthony Fu
			// https://github.com/antfu/fast-npm-meta/blob/334e913beaaf8c03595b42feaee5aed7b8d24b75/server/routes/%5B...pkg%5D.ts#L15-L35
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

interface UNPKGMetaResponse {
	package: string;
	version: string;
	prefix: string;
	files: {
		path: string;
		size: number;
		type: string;
		integrity: string;
	}[];
}

export interface FileNode {
	id: string;
	size: number;
	lang: string;
}

interface RawDirectoryNode {
	id: string;
	children: Map<string, RawTreeNode>;
}

interface DirectoryNode {
	id: string;
	size: number;
	children: TreeNode[];
}

type RawTreeNode = FileNode | RawDirectoryNode;
type TreeNode = FileNode | DirectoryNode;

function mimeToLang(mime: string) {
	switch (mime) {
		case 'text/typescript':
			return 'typescript';

		default:
			return mimes[mime]?.extensions?.[0] || 'txt';
	}
}

export const getPackageFiles = query(vSpecifier, async (specifier) => {
	const event = getRequestEvent();
	const { name, version } = await resolveSpecifier(
		specifier,
		event.platform!,
	);

	return await cached(
		`package-files:${name}-${version}`,
		event.platform!,
		600,
		async () => {
			const res = await ofetch<UNPKGMetaResponse>(
				`https://unpkg.com/${name}@${version}?meta`,
			);

			const tree = new Map<string, RawTreeNode>();

			for (const file of res.files) {
				const path = file.path.replace(/^\//, '').split('/');
				let current = tree;

				for (let i = 0; i < path.length; i++) {
					const segment = path[i]!;
					const fullPath = joinPaths('/', ...path.slice(0, i + 1));

					if (i === path.length - 1) {
						current.set(segment, {
							id: fullPath,
							size: file.size,
							lang: mimeToLang(file.type),
						});
					} else {
						if (!current.has(segment)) {
							current.set(segment, {
								id: fullPath,
								children: new Map(),
							});
						}
						current = (current.get(segment) as RawDirectoryNode)
							.children;
					}
				}
			}

			function mapToArray(map: Map<string, RawTreeNode>): TreeNode[] {
				return map
					.values()
					.map((node): TreeNode => {
						if (!('children' in node)) {
							return node;
						}

						const children = mapToArray(node.children);

						return {
							id: node.id,
							size: children.reduce(
								(acc, child) => acc + child.size,
								0,
							),
							children,
						};
					})
					.toArray();
			}

			return mapToArray(tree);
		},
	);
});
