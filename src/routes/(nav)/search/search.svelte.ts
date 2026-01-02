import { page } from '$app/state';
import type { SearchResponse } from '$lib/types/search';
import { settled, tick } from 'svelte';

const BATCH_SIZE = 20;
const CACHE_KEY = 'npm-search-cache';

interface SearchResult {
	results: SearchResponse['objects'];
	total: number;
}

async function _search(query: string, from?: number) {
	if (!query.length) {
		return { done: true, total: 0, results: [] };
	}

	const url = new URL('https://registry.npmjs.org/-/v1/search');
	url.searchParams.set('text', query);
	url.searchParams.set('size', `${BATCH_SIZE}`);
	url.searchParams.set('from', `${from || 0}`);

	const res = await fetch(url);
	const data: SearchResponse = await res.json();

	return {
		total: data.total,
		results: data.objects,
		done: data.objects.length % BATCH_SIZE !== 0,
	};
}

class Search {
	private _from = $state(0);
	// private _query = $state(page.url.searchParams.get('q') || '');
	private _query = $state('');

	get query() {
		return this._query;
	}

	set query(value: string) {
		this._query = value;
		this._from = 0;
	}

	async results() {
		// if (!this.query.trim()) {
		// 	return { done: true, total: 0, results: [] };
		// }

		const results = await Promise.all(
			Array.from(
				{ length: Math.ceil(this._from / BATCH_SIZE + 1) },
				(_, i) => _search(this.query, i === 0 ? 0 : i * BATCH_SIZE),
			),
		);

		const last = results.at(-1);

		return {
			done: last?.done ?? true,
			total: last?.total ?? 0,
			results: results.flatMap((result) => result.results),
		};
	}

	loadMore() {
		this._from += BATCH_SIZE;
	}
}

export const search = new Search();
