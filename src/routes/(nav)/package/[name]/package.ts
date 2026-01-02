import type { Packument } from '@npm/types';

export async function getPackage(name: string) {
	const res = await fetch(`https://registry.npmjs.org/${name}`);
	const data: Packument = await res.json();
	return data;
}
