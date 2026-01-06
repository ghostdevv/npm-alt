import type { InternalPackage, PackageTypeStatus } from './types';
import { getInternalPackage } from './package.server';
import type { PackumentVersion } from '@npm/types';
import type { Specifier } from './valibot.server';
import parsePackage from 'npm-package-arg';

type PackageExports =
	| string
	| Record<
			string,
			| string
			| Record<string, string>
			| (string | Record<string, string>)[]
	  >;

interface Manifest extends PackumentVersion {
	exports?: PackageExports;
}

/**
 * See whether types are found in the package exports, whether by exporting
 * TypeScript files, or by providing the "types" field. Needs some work.
 *
 * @todo should we be checking for .ts files?
 */
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

/**
 * Check whether a package manifest (PackumentVersion which is kinda like
 * a package.json) has types included. Needs some work.
 */
export function typesIncluded(manifest: Manifest) {
	return !!manifest.types || exportsHasTypes(manifest.exports);
}

/**
 * Given a package, check whether or not it has types or has a
 * definitely typed package available.
 *
 * @example Package with built-in types
 *
 * ```js
 * const pkg = await getInternalPackage({ name: 'svelte', version: '5.46.1' });
 * const status = await packageTypeStatus(pkg, platform);
 * //    ^? { status: 'built-in' }
 * ```
 *
 * @example Package with DefinitelyTyped types
 *
 * ```js
 * const pkg = await getInternalPackage({ name: 'semver', version: '7.7.3' });
 * const status = await packageTypeStatus(pkg, platform);
 * //    ^? { status: 'semver', pkg: '@types/semver' }
 * ```
 */
export async function packageTypeStatus(
	pkg: InternalPackage,
	platform: App.Platform,
): Promise<PackageTypeStatus> {
	if (pkg.typesIncluded) {
		return { status: 'built-in' };
	}

	const definitelyTypedPkg = pkg.name.startsWith('@')
		? pkg.name.replace('/', '__').replace('@', '@types/')
		: `@types/${pkg.name}`;

	const dt = await getInternalPackage(
		parsePackage(`${definitelyTypedPkg}@latest`) as Specifier,
		platform,
	).catch(() => null);

	return dt
		? { status: 'definitely-typed', pkg: definitelyTypedPkg }
		: { status: 'none' };
}
