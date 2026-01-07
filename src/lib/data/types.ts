import type { ModuleReplacement } from 'module-replacements';

/**
 * The status of types for a package version.
 *
 * - `definitely-typed` - package only has types via definitely typed.
 *                        `pkg` field gives the name of said dt package.
 * - `built-in` - types are included with the package
 * - `none` - no types found
 */
export type PackageTypeStatus =
	| { status: 'definitely-typed'; pkg: string }
	| { status: 'built-in' }
	| { status: 'none' };

/**
 * Internal representation of an exact npm package version.
 * Fields are added and removed based on what is actually used,
 * with the goal of keeping the cache small and reducing repeat
 * requests to the npm registry.
 */
export interface InternalPackage {
	name: string;
	version: string;
	repoURL?: string;
	repoDir?: string;
	homepage?: string;
	deprecated?: string;
	license?: string;
	size?: number;
	publishedAt: Date;
	createdAt: Date;
	updatedAt: Date;
	typesIncluded: boolean;
}

/**
 * Filtered {@link ModuleReplacement} to remove the `type: 'none'`
 * replacements.
 */
export type ModReplacement = Exclude<ModuleReplacement, { type: 'none' }>;

/**
 * Package representation used on the client.
 */
export interface Package {
	name: string;
	version: string;
	repo?: {
		link: string;
		dir?: string;
		assets: string;
	};
	homepage?: string;
	replacements: ModReplacement[];
	types: PackageTypeStatus;
	deprecated?: string;
	license?: string;
	unpackedSize?: number;
	publishedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Internal representation of a npm package's versions.
 * See {@link InternalPackage} for more information.
 */
export interface InternalPackageVersions {
	name: string;
	versions: {
		version: string;
		deprecated?: boolean;
		license?: string;
		size?: number;
		publishedAt: Date;
	}[];
}

/**
 * Package version representation used on the client.
 */
export interface PackageVersion {
	version: string;
	group: string;
	groupState: 'deprecated' | 'lead' | null;
	license?: string;
	unpackedSize?: number;
	publishedAt: Date;
}

/**
 * The approximate changelog for a package, in markdown form. In decending
 * order of presumed accuracy, the source could be:
 *
 * - `npm` - from a CHANGELOG.md file in the npm package files
 * - `git` - from a CHANGELOG.md file in the package's repo
 * - `gh-releases` - from the GitHub releases of a package's repo
 */
export interface PackageChangelog {
	source: 'npm' | 'git' | 'gh-releases';
	content: string;
}
