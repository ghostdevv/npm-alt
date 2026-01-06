import { getRequestEvent, query } from '$app/server';
import { cached, registry } from './common.server';
import type { Packument } from '@npm/types';
import { vSpecifier } from '$lib/valibot';
import semver from 'semver';

export interface PackageVersion {
	version: string;
	group: string;
	groupState: 'deprecated' | 'lead' | null;
	license?: string;
	unpackedSize?: number;
	publishedAt: Date | null;
}

export const getPackageVersions = query(vSpecifier, async ({ name }) => {
	const event = getRequestEvent();

	return await cached(
		`package-versions:${name}`,
		event.platform!,
		60,
		async () => {
			const pkg = await registry<Packument>(`/${name}`);

			const versions = Object.values(pkg.versions)
				.map((pkv): PackageVersion & { _v: semver.SemVer } => {
					const date = new Date(pkg.time[pkv.version]);
					const versionParsed = semver.parse(pkv.version)!;

					return {
						version: pkv.version,
						_v: versionParsed,
						group: versionParsed.major
							? `${versionParsed.major}.x`
							: `0.${versionParsed.minor}`,
						groupState: pkv.deprecated ? 'deprecated' : null, // lead set later
						license: pkv.license,
						unpackedSize: pkv.dist.unpackedSize,
						publishedAt: Number.isNaN(date.getTime()) ? null : date,
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
		},
	);
});
