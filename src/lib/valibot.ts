import parsePackage from 'npm-package-arg';
import * as v from 'valibot';

// todo validate username chars
export const username = v.pipe(v.string(), v.minLength(1));

// todo validate package name
export const packageName = v.pipe(v.string(), v.minLength(1));

// todo validate semver
export const semver = v.pipe(v.string(), v.minLength(1));

// todo properly
export const semverOrTag = v.union([semver, v.literal('latest')]);

export type Specifier = Omit<parsePackage.RegistryResult, 'name'> & {
	name: string;
};

// todo properly
export const vSpecifier = v.pipe(
	v.string(),
	v.minLength(1),
	v.transform((specifier): Specifier => {
		try {
			return parsePackage(specifier) as Specifier;
		} catch (error) {
			throw new Error(`Invalid version specifier: ${specifier}`);
		}
	}),
	v.check(
		(specifier) => ['tag', 'version', 'range'].includes(specifier.type),
		'unsupported version specifier type',
	),
	v.check((specifier) => !!specifier.name, 'package name is missing'),
	// v.check(
	// 	(specifier) => specifier !== null,
	// 	'failed to parse package specifier',
	// ),
);
