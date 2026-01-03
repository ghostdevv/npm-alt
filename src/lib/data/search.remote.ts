import type { PackageLinks } from './package.remote';
import { username } from '$lib/valibot';
import { query } from '$app/server';
import * as v from 'valibot';
import { registry } from './registry.server';

interface SearchResponse {
	objects: Object[];
	total: number;
	time: string;
}

interface Object {
	downloads: Downloads;
	dependents: any;
	updated: string;
	searchScore: number;
	package: SearchPackage;
}

export interface SearchPackage {
	name: string;
	keywords: string[];
	version: string;
	description?: string;
	sanitized_name: string;
	license?: string;
	date: string;
	links: PackageLinks;
}

interface Downloads {
	monthly: number;
	weekly: number;
}

const SEARCH_BATCH_SIZE = 20;

export const searchRegistry = query(
	v.object({
		query: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
		from: v.pipe(v.number(), v.integer()),
	}),
	async ({ query, from }) => {
		if (!query.length) {
			return { done: true, total: 0, results: [] };
		}

		const data = await registry<SearchResponse>('/-/v1/search', {
			query: {
				text: query,
				size: SEARCH_BATCH_SIZE,
				from: from || 0,
			},
		});

		return {
			total: data.total,
			results: data.objects,
			done: data.objects.length % SEARCH_BATCH_SIZE !== 0,
		};
	},
);

const AUTHOR_BATCH_SIZE = 250;

export const listAuthorPackages = query(username, async (author) => {
	const packages: SearchPackage[] = [];

	do {
		const data = await registry<SearchResponse>('/-/v1/search', {
			query: {
				text: `maintainer:${author}`,
				size: AUTHOR_BATCH_SIZE,
				from: packages.length,
			},
		});

		for (const object of data.objects) {
			packages.push(object.package);
		}
	} while (packages.length % AUTHOR_BATCH_SIZE === 0);

	return packages;
});
