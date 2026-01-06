import microUtils from 'module-replacements/manifests/micro-utilities.json' with { type: 'json' };
import preferred from 'module-replacements/manifests/preferred.json' with { type: 'json' };
import native from 'module-replacements/manifests/native.json' with { type: 'json' };
import { cached, registry, resolveSpecifier } from './common.server';
import type { Packument, PackumentVersion } from '@npm/types';
import type { ModuleReplacement } from 'module-replacements';
import { getRequestEvent, query } from '$app/server';
import hostedGitInfo from 'hosted-git-info';
import { vSpecifier } from '$lib/valibot';

const allModuleReplacements = [
	...microUtils.moduleReplacements,
	...native.moduleReplacements,
	...preferred.moduleReplacements,
] as ModuleReplacement[];

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

export interface PackageTypeStatus {
	status: 'built-in' | 'definitely-typed' | 'none';
	definitelyTypedPkg: string;
}

type PackageExports =
	| string
	| Record<
			string,
			| string
			| Record<string, string>
			| (string | Record<string, string>)[]
	  >;

interface ExportsPackumentVersion extends PackumentVersion {
	exports?: PackageExports;
}

function exportsHasTypes(exports?: PackageExports): boolean {
	try {
		return (
			// "exports": "./foo.ts"
			(typeof exports === 'string' && exports.endsWith('ts')) ||
			// "exports": { ".": "./foo.ts" }
			(typeof exports !== 'string' &&
				typeof exports?.['.'] === 'string' &&
				exports?.['.'].endsWith('ts')) ||
			// "exports": { ".": { types: "./foo.ts" } }
			(typeof exports !== 'string' &&
				typeof exports?.['.'] !== 'string' &&
				!Array.isArray(exports?.['.']) &&
				exports?.['.']?.types.endsWith('ts')) ||
			// "exports": { ".": ["./foo.ts", { "types": "./foo.ts" }] }
			(typeof exports !== 'string' &&
				Array.isArray(exports?.['.']) &&
				exports?.['.']?.some((e) => exportsHasTypes(e)))
		);
	} catch (error) {
		console.error('failed to handle exports', exports);
		return false;
	}
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

	if (exportsHasTypes(pkg.exports)) {
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
