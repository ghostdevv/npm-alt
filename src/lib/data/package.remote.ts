import { cached, registry, USER_AGENT } from './common.server';
import type { Packument, PackumentVersion } from '@npm/types';
import { serendipity } from '$lib/assets/serendipity-shiki';
import { packageName, semverOrTag } from '$lib/valibot';
import { getRequestEvent, query } from '$app/server';
import createDOMPurify from 'dompurify';
import markedShiki from 'marked-shiki';
import { error } from '@sveltejs/kit';
import * as semver from '@std/semver';
import { codeToHtml } from 'shiki';
import { ofetch } from 'ofetch';
import { Marked } from 'marked';
import { JSDOM } from 'jsdom';
import * as v from 'valibot';
import {
	all,
	type DocumentedModuleReplacement,
	type ModuleReplacement,
} from 'module-replacements';

function getPackageJSON(pkg: Packument, _version: string) {
	return pkg['versions'][pkg['dist-tags']['latest']!];
}

export interface PackageLinks {
	repository?: string;
	homepage?: string;
	npm: string;
}

export interface Package {
	name: string;
	version: string;
	packageJSON: PackumentVersion;
	links: PackageLinks;
	moduleReplacements: ModuleReplacement[];
	types: PackageTypeStatus;
}

export const getPackage = query(
	v.object({ name: packageName, specifier: semverOrTag }),
	async ({ name, specifier }) => {
		const event = getRequestEvent();
		const version = await getRealVersion(name, specifier, event.platform!);

		return await cached(
			`get-package:${name}-${version}`,
			event.platform!,
			600,
			async () => {
				const pkg = await registry<Packument>(`/${name}`);
				const packageJSON = getPackageJSON(pkg, version);

				const moduleReplacements = all.moduleReplacements.filter(
					(m) => m.type !== 'none' && m.moduleName === name,
				);

				const types = await packageTypeStatus(
					packageJSON,
					event.platform!,
				);

				return {
					name: pkg.name,
					version: packageJSON.version,
					packageJSON,
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
	},
);

interface PackumentVersionWithExports extends PackumentVersion {
	exports?: string | Record<string, string | Record<string, string>>;
}

function hasExports(
	pkgJSON: PackumentVersion,
): pkgJSON is PackumentVersionWithExports {
	return 'exports' in pkgJSON;
}

function definitelyTypedName(pkgName: string) {
	return pkgName.startsWith('@')
		? pkgName.replace('/', '__').replace('@', '@types/')
		: pkgName;
}

interface PackageTypeStatus {
	status: 'built-in' | 'definitely-typed' | 'none';
	definitelyTypedPkg?: string;
}

async function packageTypeStatus(
	pkg: PackumentVersion,
	platform: App.Platform,
): Promise<PackageTypeStatus> {
	const definitelyTypedPkg = definitelyTypedName(pkg.name);

	if (pkg.types) {
		return { status: 'built-in', definitelyTypedPkg };
	}

	if (hasExports(pkg)) {
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

const marked = new Marked(
	markedShiki({
		async highlight(code, lang) {
			return await codeToHtml(code, { lang, theme: serendipity });
		},
	}),
);

async function renderMarkdown(markdown: string) {
	const md = await marked.parse(markdown, { gfm: true });

	const window = new JSDOM('').window;
	const dompurify = createDOMPurify(window);

	return dompurify.sanitize(md);
}

export const renderREADME = query(
	v.object({ name: packageName, specifier: semverOrTag }),
	async ({ name, specifier }) => {
		const event = getRequestEvent();
		const version = await getRealVersion(name, specifier, event.platform!);

		return await cached(
			`readme:${name}-${version}`,
			event.platform!,
			600,
			async () => {
				const pkg = await registry<PackumentVersion>(
					`/${name}/${version}`,
				);

				let readme = pkg.readme || null;

				readme ??= await ofetch(
					`https://unpkg.com/${name}@${version}/README.md`,
					{
						responseType: 'text',
						headers: { 'User-Agent': USER_AGENT },
					},
				).catch(() => null);

				if (!readme) {
					return null;
				}

				return await renderMarkdown(readme);
			},
		);
	},
);

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

async function getRealVersion(
	name: string,
	specifier: string,
	platform: App.Platform,
) {
	if (semver.canParse(specifier)) {
		return specifier;
	}

	return await cached(
		`real-version:${name}-${specifier}`,
		platform,
		60,
		async () => {
			const res = await registry<PackumentVersion>(
				`/${name}/${specifier}`,
			);
			return res.version;
		},
	);
}
