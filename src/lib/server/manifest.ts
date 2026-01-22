import type { Contact, Dist, PackumentVersion } from '@npm/types';

/**
 * Rough representation of what a package.json exports field may look like
 */
export type PackageExports =
	| string
	| Record<
			string,
			| string
			| Record<string, string>
			| (string | Record<string, string>)[]
	  >;

/**
 * Patched {@link PackumentVersion} type to add missing fields
 */
export interface Manifest extends Exclude<PackumentVersion, '_npmUser'> {
	exports?: PackageExports;
	_npmUser?: Contact & {
		trustedPublisher?: {
			id: string;
			oidcConfigId: string;
		};
	};
	dist: Dist & {
		attestations?: {
			url?: string;
			provenance?: {
				predicateType: string;
			};
		};
	};
}
