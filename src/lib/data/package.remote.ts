import type { Packument, PackumentVersion } from '@npm/types';
import { registry, USER_AGENT } from './registry.server';
import { packageName, semver } from '$lib/valibot';
import createDOMPurify from 'dompurify';
import markedShiki from 'marked-shiki';
import { query } from '$app/server';
import { codeToHtml } from 'shiki';
import { ofetch } from 'ofetch';
import { Marked } from 'marked';
import { JSDOM } from 'jsdom';
import * as v from 'valibot';

function getPackageJSON(pkg: Packument, _version: string) {
	return pkg['versions'][pkg['dist-tags']['latest']!];
}

export interface Package {
	name: string;
	version: string;
	packageJSON: PackumentVersion;
	links: {
		repository?: string;
		homepage?: string;
		npm: string;
	};
}

export const getPackage = query(
	v.object({ name: packageName, version: semver }),
	async ({ name, version }) => {
		const pkg = await registry<Packument>(`/${name}`);
		const packageJSON = getPackageJSON(pkg, version);

		return {
			name: pkg.name,
			version: packageJSON.version,
			packageJSON,
			links: {
				repository: pkg.repository?.url,
				homepage: pkg.homepage,
				npm: `https://www.npmjs.com/package/${pkg.name}`,
			},
		};
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

export const packageTypeStatus = query(
	v.object({ name: packageName, version: semver }),
	async ({ name, version }): Promise<PackageTypeStatus> => {
		const pkg = await registry<PackumentVersion>(`/${name}/${version}`);
		const definitelyTypedPkg = definitelyTypedName(pkg.name);

		if (pkg.types) {
			return { status: 'built-in', definitelyTypedPkg };
		}

		if (hasExports(pkg)) {
			const builtIn =
				// "exports": "./foo.ts"
				(typeof pkg.exports === 'string' &&
					pkg.exports.endsWith('ts')) ||
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

		const res = await registry(`/${definitelyTypedPkg}/latest`)
			// prettier-ignore
			.catch(() => null);

		return {
			status: res ? 'definitely-typed' : 'none',
			definitelyTypedPkg,
		};
	},
);

const marked = new Marked(
	markedShiki({
		async highlight(code, lang) {
			return await codeToHtml(code, { lang, theme: 'nord' });
		},
	}),
);

export const renderREADME = query(
	v.object({ name: packageName, version: semver }),
	async ({ name, version }) => {
		const pkg = await registry<PackumentVersion>(`/${name}/${version}`);
		let readme = pkg.readme || null;

		readme ??= await ofetch(
			`https://unpkg.com/${name}@${version}/README.md`,
			{ responseType: 'text', headers: { 'User-Agent': USER_AGENT } },
		).catch(() => null);

		if (!readme) {
			return null;
		}

		const md = await marked.parse(readme, { gfm: true });

		const window = new JSDOM('').window;
		const dompurify = createDOMPurify(window);

		await new Promise((resolve) => setTimeout(resolve, 1000));

		return dompurify.sanitize(md);
	},
);
