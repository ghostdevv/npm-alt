import type { Package, SearchResponse } from '$lib/types/search';

const BATCH_SIZE = 250;

export async function listPackages(author: string) {
	const packages: Package[] = [];

	do {
		const url = new URL('https://registry.npmjs.org/-/v1/search');
		url.searchParams.set('text', `maintainer:${author}`);
		url.searchParams.set('size', `${BATCH_SIZE}`);
		url.searchParams.set('from', `${packages.length}`);

		const res = await fetch(url);
		const data: SearchResponse = await res.json();

		for (const object of data.objects) {
			packages.push(object.package);
		}
	} while (packages.length % BATCH_SIZE === 0);

	return packages;
}
