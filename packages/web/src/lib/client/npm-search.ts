type SearchResponse = SearchSuccess | SearchError;

interface SearchSuccess {
	objects: SearchObject[];
	total: number;
	time: string;
}

interface SearchError {
	error: string;
	code: string;
}

export interface SearchObject {
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

interface PackageLinks {
	repository?: string;
	homepage?: string;
	npm: string;
}

export interface SearchResult {
	total: number;
	done: boolean;
	objects: SearchSuccess['objects'];
}

export async function searchNPM(
	query: string,
	from: number,
	size: number,
	signal?: AbortSignal,
): Promise<SearchResult> {
	if (!query) {
		return {
			total: 0,
			done: true,
			objects: [],
		};
	}

	const url = new URL('https://registry.npmjs.org/-/v1/search');
	url.searchParams.set('text', query);
	url.searchParams.set('size', `${size}`);
	url.searchParams.set('from', `${from}`);

	try {
		const res = await fetch(url, { signal });
		const data = await res.json<SearchResponse>();

		if ('error' in data) {
			throw new Error(`search failed: ${data.error} (${data.code})`);
		}

		return {
			done: data.objects.length % size !== 0,
			objects: data.objects,
			total: data.total,
		};
	} catch (error) {
		throw new Error('failed to search npm', { cause: error });
	}
}
