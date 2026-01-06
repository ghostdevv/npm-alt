import { version } from '../../../package.json' with { type: 'json' };
import { parse, stringify } from 'devalue';
import { ofetch } from 'ofetch';

const USER_AGENT = `npm-alt/${version}`;

export const registry = ofetch.create({
	baseURL: 'https://registry.npmjs.org',
	headers: {
		'User-Agent': USER_AGENT,
	},
	retry: 3,
	retryDelay: 500,
});

export async function cached<T>(
	key: string,
	platform: App.Platform,
	ttl: number,
	fn: () => Promise<T>,
) {
	if (!platform.env.CACHE) {
		console.warn(`[kv-cache=${key}] CACHE not available`);
		return await fn();
	}

	const hit = await platform.env.CACHE.get(key, 'text');

	if (hit) {
		console.log(`[kv-cache=${key}] HIT`);
		return parse(hit) as T;
	}

	const data = await fn();
	await platform.env.CACHE.put(key, stringify(data), {
		expirationTtl: ttl,
	});

	console.log(`[kv-cache=${key}] MISS`);

	return data;
}
