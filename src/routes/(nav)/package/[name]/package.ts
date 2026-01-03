import type { Packument, PackumentVersion } from '@npm/types';

export async function getPackage(name: string) {
	const res = await fetch(`https://registry.npmjs.org/${name}`);
	const data: Packument = await res.json();
	return data;
}

export function getPackageJSON(pkg: Packument) {
	return pkg['versions'][pkg['dist-tags']['latest']!];
}

interface PackumentVersionWithExports extends PackumentVersion {
	exports?: string | Record<string, string | Record<string, string>>;
}

function hasExports(
	pkgJSON: PackumentVersion,
): pkgJSON is PackumentVersionWithExports {
	return 'exports' in pkgJSON;
}

export function definitelyTypedName(pkgName: string) {
	return pkgName.startsWith('@')
		? pkgName.slice(1).replace('/', '__')
		: pkgName;
}

export async function hasTypes(
	pkgJSON: PackumentVersion,
): Promise<'built-in' | 'dt' | false> {
	if (pkgJSON.types) {
		return 'built-in';
	}

	if (hasExports(pkgJSON)) {
		if (typeof pkgJSON.exports === 'string') {
			return pkgJSON.exports.endsWith('ts') && 'built-in';
		}

		if (typeof pkgJSON.exports?.['.'] === 'string') {
			return pkgJSON.exports?.['.'].endsWith('ts') && 'built-in';
		}

		if (pkgJSON.exports?.['.']?.types) {
			return 'built-in';
		}
	}

	const res = await fetch(
		`https://registry.npmjs.org/${definitelyTypedName(pkgJSON.name)}`,
	);

	return res.ok ? 'dt' : false;
}
