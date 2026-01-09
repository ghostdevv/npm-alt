import { get, set } from 'idb-keyval';

interface Record<T> {
	expiresAt: number | null;
	version: number;
	content: T;
}

interface CacheOptions<T, A> {
	/** ttl in seconds */
	ttl?: number;

	/** version of the cached value, alternative to ttl */
	version?: number;

	/** the value to cache */
	value: (...args: A[]) => Promise<T>;
}

export function cache<T, A>(options: CacheOptions<T, A>) {
	return async (key: string, ...args: A[]) => {
		const hit = await get<Record<T>>(key);

		if (
			hit &&
			// if there is a version given, it must be the same
			(typeof options.version !== 'number' ||
				hit.version === options.version) &&
			// if there is a ttl given, it must be in the future
			(hit.expiresAt === null || hit.expiresAt > Date.now())
		) {
			return hit.content;
		}

		const value = await options.value(...args);

		await set(key, {
			expiresAt: options.ttl ? Date.now() + options.ttl * 1000 : null,
			version: options.version ?? 0,
			content: value,
		});

		return value;
	};
}
