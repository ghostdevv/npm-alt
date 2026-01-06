import { get, set } from 'idb-keyval';

interface Record<T> {
	expiresAt: number | null;
	content: T;
}

export function cache<T, A>(
	ttlMs: number | null,
	fn: (...args: A[]) => Promise<T>,
) {
	return async (key: string, ...args: A[]) => {
		const hit = await get<Record<T>>(key);

		if (hit && (hit.expiresAt === null || hit.expiresAt > Date.now())) {
			return hit.content;
		}

		const value = await fn(...args);

		await set(key, {
			expiresAt: ttlMs ? Date.now() + ttlMs : null,
			content: value,
		});

		return value;
	};
}
