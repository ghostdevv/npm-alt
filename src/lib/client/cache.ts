import { get, set } from 'idb-keyval';

interface Record {
	expiresAt: number | null;
	content: string;
}

export function cache<A>(
	ttlMs: number | null,
	fn: (...args: A[]) => Promise<string>,
) {
	return async (key: string, ...args: A[]) => {
		const hit = await get<Record>(key);

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
