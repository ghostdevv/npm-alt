import { version } from '../../../package.json' with { type: 'json' };
import { parse, stringify } from 'devalue';

export const USER_AGENT = `npm-alt/${version} (+https://github.com/ghostdevv/npm-alt)`;

interface CacheOptions<T> {
	/**
	 * The key that identifies the cached value.
	 * The first part is the prefix, that should be constant.
	 * The second part should be unique for each cache entry.
	 */
	key: `${string}:${string}`;

	/**
	 * Access to Cloudflare
	 */
	platform: App.Platform;

	/**
	 * Time in seconds that the cached value should live
	 */
	ttl: number;

	/**
	 * When enabled the value in the cache is ignored and
	 * overwritten by the new `value` call.
	 */
	force?: boolean;

	/**
	 * Fn that returns the value to be cached. Should\
	 * be serialisable with devalue.
	 */
	value: () => Promise<T>;
}

/**
 * Cache the value in Cloudflare KV, with a given ttl.
 */
export async function cached<T>(o: CacheOptions<T>): Promise<T> {
	if (!o.platform.env.CACHE) {
		console.warn(`[kv-cache=${o.key}] CACHE not available`);
		return await o.value();
	}

	if (!o.force) {
		const hit = await o.platform.env.CACHE.get(o.key, 'text');

		if (hit) {
			console.log(`[kv-cache=${o.key}] HIT`);
			return parse(hit) as T;
		}
	}

	const value = await o.value();
	await o.platform.env.CACHE.put(o.key, stringify(value), {
		expirationTtl: o.ttl,
	});

	console.log(`[kv-cache=${o.key}] ${o.force ? 'FORCE' : 'MISS'}`);

	return value;
}

/**
 * Check whether a URL is definitely a URL, and for
 * another website.
 */
export function checkURL(raw: string): string | null {
	const url = URL.parse(raw);
	if (!url) return null;

	if (!['http:', 'https:'].includes(url.protocol)) {
		return null;
	}

	url.protocol = 'https:';

	return url.toString();
}
