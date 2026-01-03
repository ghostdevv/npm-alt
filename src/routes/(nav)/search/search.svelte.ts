import { searchRegistry } from '$lib/data/search.remote';

const SEARCH_BATCH_SIZE = 20;

class Search {
	private _from = $state(0);
	private _query = $state('');

	get query() {
		return this._query;
	}

	set query(value: string) {
		this._query = value;
		this._from = 0;
	}

	async results() {
		const results = await Promise.all(
			Array.from(
				{ length: Math.ceil(this._from / SEARCH_BATCH_SIZE + 1) },
				async (_, i) => {
					return await searchRegistry({
						query: this.query,
						from: i === 0 ? 0 : i * SEARCH_BATCH_SIZE,
					});
				},
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
		this._from += SEARCH_BATCH_SIZE;
	}
}

export const search = new Search();
