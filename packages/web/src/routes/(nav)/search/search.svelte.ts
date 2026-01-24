import { searchNPM, type SearchResult } from '$lib/client/npm-search';
import { getAbortSignal } from 'svelte';

const BATCH_SIZE = 20;

class Search {
	private _from = $state(0);
	private _query = $state('');
	private debounce: ReturnType<typeof setTimeout> | null = null;

	get query() {
		return this._query;
	}

	set query(value: string) {
		if (this.debounce) {
			clearTimeout(this.debounce);
		}

		this.debounce = setTimeout(() => {
			this._query = value;
			this._from = 0;
			this.cache.clear();
		}, 250);
	}

	private cache = new Map<number, SearchResult>();

	async results() {
		const query = this.query;

		if (query.trim().length <= 1) {
			throw new Error('npm search must be at least 2 characters long');
		}

		const signal = getAbortSignal();

		try {
			const results = await Promise.all(
				Array.from(
					{ length: Math.ceil(this._from / BATCH_SIZE + 1) },
					async (_, i) => {
						const from = i * BATCH_SIZE;
						const query = this.query;

						const hit = this.cache.get(from);
						if (hit) return hit;

						const res = await searchNPM(
							query,
							from,
							BATCH_SIZE,
							signal,
						);

						this.cache.set(from, res);

						return {
							done: res.objects.length !== BATCH_SIZE,
							objects: res.objects,
							total: res.total,
						};
					},
				),
			);

			const last = results.at(-1);

			return {
				done: last?.done ?? true,
				total: last?.total ?? 0,
				results: results.flatMap((result) => result.objects),
			};
		} catch (error) {
			throw error;
		}
	}

	loadMore() {
		this._from += BATCH_SIZE;
	}
}

export const search = new Search();
