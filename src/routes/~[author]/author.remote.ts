import type { Package, SearchResult } from '$lib/types/search';
import { username } from '$lib/valibot';
import { query } from '$app/server';

const BATCH_SIZE = 250;

export const listPackages = query(username, async (author) => {
	const packages: Package[] = [];

	do {
		const url = new URL('https://registry.npmjs.org/-/v1/search');
		url.searchParams.set('text', `maintainer:${author}`);
		url.searchParams.set('size', `${BATCH_SIZE}`);
		url.searchParams.set('from', `${packages.length}`);

		const res = await fetch(url);
		const data: SearchResult = await res.json();

		for (const object of data.objects) {
			packages.push(object.package);
		}
	} while (packages.length % BATCH_SIZE === 0);

	return packages;
});
