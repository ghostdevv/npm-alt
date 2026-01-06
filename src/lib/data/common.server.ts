import { version } from '../../../package.json' with { type: 'json' };
import type { Specifier } from '$lib/valibot';
import type { Packument } from '@npm/types';
import { parse, stringify } from 'devalue';
import { ofetch } from 'ofetch';
import semver from 'semver';

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

export async function resolveSpecifier(
	specifier: Specifier,
	platform: App.Platform,
) {
	if (specifier.type === 'version') {
		return { name: specifier.name, version: specifier.fetchSpec };
	}

	return await cached(
		`parsed-specifier:${specifier}`,
		platform,
		60,
		async () => {
			const pkg = await registry<Packument>(`/${specifier.name}`);
			let version: string | null = null;

			// Based on MIT Licensed code from Anthony Fu
			// https://github.com/antfu/fast-npm-meta/blob/334e913beaaf8c03595b42feaee5aed7b8d24b75/server/routes/%5B...pkg%5D.ts#L15-L35
			if (specifier.type === 'tag') {
				version = pkg['dist-tags'][specifier.fetchSpec] || null;
			} else if (
				specifier.type === 'range' &&
				['*', 'latest'].includes(specifier.fetchSpec)
			) {
				version = pkg['dist-tags'].latest || null;
			} else if (specifier.type === 'range') {
				let maxVersion = pkg['dist-tags'].latest || null;
				if (!semver.satisfies(maxVersion!, specifier.fetchSpec))
					maxVersion = null;

				for (const ver of Object.keys(pkg.versions)) {
					if (semver.satisfies(ver, specifier.fetchSpec)) {
						if (!maxVersion || semver.lte(ver, maxVersion))
							version = ver;
					}
				}
			}

			return { name: specifier.name, version: version! };
		},
	);
}
