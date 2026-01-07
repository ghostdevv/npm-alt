import { searchNPM, type SearchResult } from '$lib/client/npm-search';

const BATCH_SIZE = 20;

class Search {
	private _from = $state(0);
	private _query = $state('');

	get query() {
		return this._query;
	}

	set query(value: string) {
		this._query = value;
		this._from = 0;
		this.cache.clear();
	}

	private cache = new Map<number, SearchResult>();

	async results() {
		const results = await Promise.all(
			Array.from(
				{ length: Math.ceil(this._from / BATCH_SIZE + 1) },
				async (_, i) => {
					const from = i * BATCH_SIZE;
					const query = this.query;

					const hit = this.cache.get(from);
					if (hit) return hit;

					const res = await searchNPM(query, from, BATCH_SIZE);
					this.cache.set(from, res);

					return {
						done: res.objects.length % BATCH_SIZE !== 0,
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
	}

	loadMore() {
		this._from += BATCH_SIZE;
	}
}

export const search = new Search();
