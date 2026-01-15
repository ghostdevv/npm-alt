import type { Packument, PackumentVersion } from '@npm/types';
import { cached, checkURL, USER_AGENT } from './common';
import type { Specifier } from '$lib/server/valibot';
import { typesIncluded } from './package-types';
import { ofetch, FetchError } from 'ofetch';
import parsePackage from 'npm-package-arg';
import { error } from '@sveltejs/kit';
import semver from 'semver';
import {
	type InternalPackageVersions,
	type InternalPackage,
	isFundingType,
	type Funding,
	type Dependency,
} from '../data/types';

/**
 * Fetch a {@link Packument} for a given package name from npm.
 */
async function getPackument(name: string): Promise<Packument> {
	try {
		return await ofetch<Packument>(`/${name}`, {
			baseURL: 'https://registry.npmjs.org',
			headers: {
				'User-Agent': USER_AGENT,
			},
			retry: 3,
			retryDelay: 500,
		});
	} catch (_err) {
		const err = _err as FetchError<Packument>;

		if (err.status === 404) {
			error(404, 'Package not found');
		} else {
			console.error('failed to fetch packument', error);
			error(500, 'Failed to fetch package, try again?');
		}
	}
}

/**
 * Parse the funding information from a {@link PackumentVersion} to
 * the internal {@link Funding} format.
 */
function parseFunding(funding?: PackumentVersion['funding']): Funding[] {
	if (!funding) return [];

	if (typeof funding == 'string') {
		const url = checkURL(funding);
		return url ? [{ url }] : [];
	}

	if (Array.isArray(funding)) {
		return funding.flatMap((f) => parseFunding(f));
	}

	const url = checkURL(funding.url);
	if (!url) return [];

	return isFundingType(funding.type)
		? [{ type: funding.type, url }]
		: [{ url }];
}

/**
 * Checks whether the given name and version are a npm registry package.
 * This doesn't guarantee that the package exists, but it does guarantee that
 * it's a valid package name and version.
 */
function isRegistryPackage(name: string, version: string): boolean {
	try {
		parsePackage(`${name}@${version}`);
		return true;
	} catch (error) {
		console.error('failed to parse a package', error);
		return false;
	}
}

/**
 * Fetch the {@link InternalPackage} for a given specifier
 * (e.g. `svelte@latest`), or for an exact name and version.
 */
export async function getInternalPackage(
	specifier: ResolvableSpecifier,
	platform: App.Platform,
): Promise<InternalPackage> {
	const spec = await resolveSpecifier(specifier, platform);

	const core = await cached({
		key: `pkg:${spec.name}@${spec.version}`,
		version: 1,
		platform,
		ttl: 86400,
		async value(): Promise<Omit<InternalPackage, 'name' | 'version'>> {
			spec.pkg ||= await getPackument(spec.name);
			const manifest = spec.pkg['versions'][spec.version];

			platform.ctx.waitUntil(
				// Since we have the packument we call this with force=true
				// to set the cache for the package versions. This is to
				// avoid storing the versions on the internal package to
				// reduce it's size.
				getInternalPackageVersions(spec, platform, true),
			);

			/**
			 * Helper to collect dependencies from the manifest.
			 */
			function collect(
				deps: Record<string, string> | undefined,
				type: Dependency['type'],
				optional: boolean | ((name: string) => boolean),
				skip?: (name: string) => boolean,
			): Dependency[] {
				if (!deps) return [];

				return Object.entries(deps)
					.map(([name, version]) => {
						if (skip?.(name)) {
							return null;
						}

						return {
							type,
							name,
							version,
							registry: isRegistryPackage(name, version),
							optional:
								typeof optional === 'function'
									? optional(name)
									: optional,
						} as Dependency;
					})
					.filter((d): d is Dependency => d !== null);
			}

			const dependencies: Dependency[] = [
				// Production dependencies (excluding those also declared as optional)
				...collect(
					manifest.dependencies,
					'prod',
					false,
					(name) => !!manifest.optionalDependencies?.[name],
				),

				// Development dependencies
				...collect(manifest.devDependencies, 'dev', false),

				// Optional dependencies (always marked optional)
				...collect(manifest.optionalDependencies, 'prod', true),

				// Peer dependencies (optional may come from peerDependenciesMeta)
				...collect(
					manifest.peerDependencies,
					'peer',
					(name) =>
						manifest.peerDependenciesMeta?.[name]?.optional ??
						false,
				),
			];

			return {
				repoURL: manifest.repository?.url,
				repoDir: manifest.repository?.directory,
				homepage: manifest.homepage,
				deprecated: manifest.deprecated,
				license: manifest.license,
				size: manifest.dist.unpackedSize,
				publishedAt: new Date(spec.pkg.time[spec.version]),
				createdAt: new Date(spec.pkg.time.created),
				updatedAt: new Date(spec.pkg.time.modified),
				typesIncluded: typesIncluded(manifest),
				funding: parseFunding(manifest.funding),
				dependencies,
			};
		},
	});

	return {
		name: spec.name,
		version: spec.version,
		...core,
	};
}

interface ResolvedSpecifier {
	name: string;
	version: string;
	pkg?: Packument;
}

type ResolvableSpecifier = { name: string; version: string } | Specifier;

/**
 * "Resolve" a "specifier" (proper name?) to a real name and version.
 *
 * note from ghostdevv: In order to avoid caching the whole packument,
 * we only return it when it's actually been fetched in this _session_.
 * Not super happy with it, but it seems to be the best way to both
 * avoid a duplicate request after this fn has done it's job, and not
 * have to cache the entire packument.
 *
 * @example Given a dist tag or range, the exact version is fetched.
 *
 * ```ts
 * const specifier = ...('svelte@latest') // or svelte@^5.0.0 etc
 * const result = await resolveSpecifier(specifier)
 * //    ^? { name: 'svelte', version: '5.46.1' } // at time of writing
 * ```
 *
 * @example Given an exact version, the version is returned.
 *
 * ```ts
 * const specifier = ...('svelte@5.46.1')
 * const result = await resolveSpecifier(specifier)
 * //    ^? { name: 'svelte', version: '5.46.1' }
 * ```
 */
async function resolveSpecifier(
	specifier: ResolvableSpecifier,
	platform: App.Platform,
): Promise<ResolvedSpecifier> {
	if ('version' in specifier) {
		return specifier;
	}

	if (specifier.type === 'version') {
		return { name: specifier.name, version: specifier.fetchSpec };
	}

	let pkg: Packument | undefined = undefined;

	const result = await cached({
		key: `specifier:${specifier.name}@${specifier.fetchSpec}`,
		version: 1,
		platform,
		ttl: 300,
		async value() {
			pkg = await getPackument(specifier.name);
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
	});

	return { ...result, pkg };
}

/**
 * Fetch the internal representation of a package's versions, and
 * return as {@link InternalPackageVersions}.
 *
 * Optionally, you can `force` the value to be re-fetched and stored. This
 * is used in {@link getInternalPackage} in an attempt to reduce registry
 * requests as we already have the packument and it's likely that will have
 * been called before {@link getInternalPackageVersions}. It's possible for a
 * race condition, especially since we try to _optimise_ on the client and do
 * requests in parallel that just results in duplicate registry requests anyway.
 * However, this is currently preferable to storing the versions on the
 * {@link InternalPackageVersions} object directly. Perhaps in memory caching
 * could help with that here in some specific cases. @todo is this correct,
 * or is sveltekit merging the two requests into one network req?
 */
export async function getInternalPackageVersions(
	specifier: ResolvableSpecifier,
	platform: App.Platform,
	force = false,
): Promise<InternalPackageVersions> {
	const spec = await resolveSpecifier(specifier, platform);

	return await cached({
		key: `versions:${spec.name}`,
		version: 1,
		platform,
		ttl: 300,
		force,
		async value() {
			const pkg = spec.pkg || (await getPackument(spec.name));

			return {
				versions: Object.values(pkg.versions).map((pkv) => ({
					version: pkv.version,
					deprecated: !!pkv.deprecated,
					license: pkv.license,
					size: pkv.dist.unpackedSize,
					publishedAt: new Date(pkg.time[pkv.version]),
				})),
			};
		},
	});
}
