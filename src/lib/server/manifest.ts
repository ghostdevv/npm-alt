import type { PackumentVersion } from '@npm/types';

export type PackageExports =
	| string
	| Record<
			string,
			| string
			| Record<string, string>
			| (string | Record<string, string>)[]
	  >;

export interface Manifest extends PackumentVersion {
	exports?: PackageExports;
}
