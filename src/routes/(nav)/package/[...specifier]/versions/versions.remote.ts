import { getInternalPackageVersions } from '$lib/server/package';
import type { PackageVersion } from '$lib/data/types';
import { getRequestEvent, query } from '$app/server';
import * as ve from '$lib/server/valibot';
import semver from 'semver';

export const getPackageVersions = query(ve.specifier, async (specifier) => {
	const event = getRequestEvent();
	const pkg = await getInternalPackageVersions(specifier, event.platform!);

	const versions = Object.values(pkg.versions)
		.map((pkv): PackageVersion & { _v: semver.SemVer } => {
			const versionParsed = semver.parse(pkv.version)!;

			return {
				version: pkv.version,
				_v: versionParsed,
				group: versionParsed.major
					? `${versionParsed.major}.x`
					: `0.${versionParsed.minor}`,
				groupState: pkv.deprecated ? 'deprecated' : null, // lead set later
				license: pkv.license,
				unpackedSize: pkv.size,
				publishedAt: pkv.publishedAt,
			};
		})
		.sort((a, b) => semver.compare(b._v, a._v));

	const highestInGroups = new Map<string, string>();

	for (const pkv of versions) {
		// @ts-expect-error needs removing here
		delete pkv._v;

		if (
			pkv.groupState !== 'deprecated' &&
			!highestInGroups.has(pkv.group)
		) {
			highestInGroups.set(pkv.group, pkv.version);
			pkv.groupState = 'lead';
		}
	}

	return versions as PackageVersion[];
});
